<?php
/**
 * LICENSE
 *
 * This source file is subject to the new BSD license that is bundled
 * with this package in the file LICENSE.txt.
 */

/* This takes care of the compression towards the client , it's that simple ...
*/

ini_set("zlib.output_compression", 1);
ini_set("zlib.output_compression_level", 9);

require_once('config-light.php');

$headers = null;

if (!function_exists('getallheaders')) {
   foreach ($_SERVER as $name => $value) {
      /* RFC2616 (HTTP/1.1) defines header fields as case-insensitive entities. */
      if (strtolower(substr($name, 0, 5)) == 'http_') {
         $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
      }
   }
} else {
   $headers=getallheaders();
}

$findme='GoogleEarth';
$pos = strpos($headers['User-Agent'], $findme);
// It's google Earth, so validate

//$proxy = new CrossProxy(array('http://nm1.bitless.be/','search.php'));
$proxy = new CrossProxy(array('https://nominatim.openstreetmap.org/','search.php'));

class CrossProxy {

   const POST    = 'POST';
   const GET     = 'GET';
   const PUT     = 'PUT';
   const OPTIONS = 'OPTIONS';
   const DELETE  = 'DELETE';

   /* Some presets */ 
   protected $settings= array(
      'curl_connecttimeout' => '5',
      'curl_connecttimeout_ms' => '5000',
      'debug' => 0,
      'verbose' => 0,
      //'logfile' => 'test_bad.log',
      'user_agent_string' => 'GRB2OSM proxy user-agent'
   );

   /* Store unprocessed $_REQUEST , kind of a misleading name imho , but makes sense in terms of POST/GET etc */
   protected $request_vars = NULL;
   /* Store unprocessed $_SERVER */
   protected $server = NULL;
   /* Store semi processed request headers works: (nginx / apache) */
   protected $request_headers        = NULL;
   /* Store unprocessed request cookie from $_COOKIE : (nginx / apache) */
   protected $request_cookie        = NULL;

   /* Will hold the processed host info where proxy requests will be forwarded to (user option)*/
   protected $target_host       = NULL;
   /* Will hold the target url path which will be added to this request (user option)*/
   protected $target_path       = NULL;

   /* Will hold processed full target url */
   protected $target_url       = NULL;

   /* Now use the power of curl_info for the backend headers */
   protected $backend_curl_info = NULL;
   protected $backend_output = NULL;

   /* Will hold the header we will sent to the backend server, created from the frontend client request */
   protected $backend_request_headers   = NULL;

   /* Will hold the response body/header sent back by the server that the proxy request was made to */
   protected $backend_response_body      = NULL;
   protected $backend_response_headers   = NULL;
   protected $allowed_hostnames          = NULL;

   protected $debug        = NULL;
   protected $verbose      = 0;

   private   $fp_logfile    = NULL;

   public function __construct( $forward_host, $allowed_hostnames = NULL, $handle_errors = FALSE, $conf_settings=array()) {

      if($handle_errors) {
         $this->setErrorHandlers();
      }

      /* Check for cURL. period. the rest blows up */
      if(!function_exists('curl_init')) {
         header("HTTP/1.1 400 Bad Request"); 
         throw new Exception("Installing php5-curl first works better");
         die();
      }

      // Merge the class defaults with the settings
      if (!empty($conf_settings)) {
         $this->settings = array_merge($this->settings, $conf_settings);
      }

      if (!empty($this->settings['debug'])) {
         $this->debug=1;
      }

      if (!empty($this->settings['verbose'])) {
         $this->verbose=$this->settings['verbose'];
      }

      if (!empty($this->settings['logfile'])) {

         $this->fp_logfile = fopen($this->settings['logfile'], 'a+');
         if (!empty($this->debug)) { $this->trace(5,sprintf("%s - %s : %s", __METHOD__ , 'Opening log file', $this->settings['logfile'])); } 

         if (!is_resource($this->fp_logfile)) {
            trigger_error('log file write problem'); exit;
         }
      }

      if (!empty($this->debug)) { $this->trace(5,sprintf("%s - %s", __METHOD__ , 'Start, Parsing target host info')); } 
      /* Parse the forward host option */
      if (is_array($forward_host)) {
         list($this->target_host, $this->target_path )= array_values($forward_host);
      } else {
         $this->target_host = $forward_host;
      }

      /* Parse the allowed hostnames */
      if($allowed_hostnames !== NULL) {
         if(is_array($allowed_hostnames)) {
            $this->allowed_hostnames = $allowed_hostnames;
         } else {
            $this->allowed_hostnames[] =$allowed_hostnames;
         }
      }

      /* Store the SERVER method since we will tailor it */
      // if (!empty($this->debug)) { $this->trace(5,sprintf("%s - %s", __METHOD__ , 'Parsing _SERVER var info')); } 
      if(is_array($_SERVER)) {
         $this->server = $_SERVER;
      } else {
         header("HTTP/1.1 403 Forbidden");
         throw new Exception("Empty server vars look very suspicious");
         die();
      }

      if (!empty($this->debug)) { $this->trace(4, sprintf("%s - %s", __METHOD__ , '$_SERVER information'), $this->server); }

      /* Store the REQUEST info since we will tailor it */
      if(is_array($_REQUEST)) {
         $this->request_vars = $_REQUEST;
      } else {
         $this->request_vars = array();
      }

      if (strcmp($this->get_req_key('cmd'),'trails')==0) {
         $this->debug=1;
      }

      if (!empty($this->debug)) { $this->trace(4, sprintf("%s - %s", __METHOD__ , '$_REQUEST information'), $this->request_vars); }

      /* We can't live without 'real' user agents strings */
      if(!$this->get_srv_key('HTTP_USER_AGENT')) {
         header("HTTP/1.1 403 Forbidden");
         throw new Exception("No HTTP User Agent was found, we deny this client");
         die();
      }

      /* get cookies */
      if ($this->get_srv_key('HTTP_COOKIE')) {
         // $this->request_cookies = $_COOKIE; // Better is SRV HTTP_COOKIE
         $this->request_cookies = $this->get_srv_key('HTTP_COOKIE');
      }

      if (!empty($this->debug)) { $this->trace(5, sprintf("%s - %s : %s", __METHOD__ , 'COOKIE information', $this->request_cookies)); }

      /* Starting from version 5.4.0 , php-fastcgi will support the getallheaders function 
       * $phpVersion = phpversion();
       * if (function_exists("version_compare") && version_compare($phpVersion, "5.4.0",'<')) {
       *     // I support this for nginx/phpfpm
       * } 
       */

      /* Store the request headers From the request */
      /* for older php-fastcgi nginx support */
      if (!function_exists('getallheaders')) {
         foreach ($this->server as $name => $value) {
            /* RFC2616 (HTTP/1.1) defines header fields as case-insensitive entities. */
            if (strtolower(substr($name, 0, 5)) == 'http_') {
               $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
         }
         $this->request_headers=$headers;
      } else {
         /* for apache support */
         $this->request_headers = getallheaders();
      }
      if (!empty($this->debug)) { $this->trace(5, sprintf("%s - %s", __METHOD__ , 'Request header information'), $this->request_headers); }

      if($this->request_headers === FALSE) {
         header("HTTP/1.1 412 Precondition Failed"); 
         throw new Exception("Could not get request headers");
         die();
      }

      if (!$this->get_srv_key('REQUEST_METHOD')) {
         header("HTTP/1.1 405 Method Not Allowed");
         throw new Exception("Request method unknown or empty");
         die();
      }

      $method = strtoupper($this->get_srv_key('REQUEST_METHOD'));

      if(!in_array($method, array(self::GET, self::PUT, self::DELETE, self::POST, self::OPTIONS))) {
         header(sprintf("HTTP/1.1 405 Method Not Allowed (%s)",$method));
         throw new Exception("Request method ($method) invalid");
         die();
      }
      $this->request_method=$method;

      if (!empty($this->debug)) { $this->trace(5, sprintf("%s - %s : %s", __METHOD__ , 'Incomming request method', $this->request_method)); }

      if($this->request_method === self::POST || $this->request_method === self::PUT) {
         if (!empty($this->debug)) { $this->trace(5, sprintf("%s - Reading %s php input", __METHOD__ , $this->request_method)); }
         $this->request_body = @file_get_contents('php://input');
      }
      // Options request are related to cross domain functionality, we could do some more with this later
      if( $this->request_method === self::OPTIONS ) {
         if (!empty($this->debug)) { $this->trace(4, sprintf("%s - %s", __METHOD__ , 'OPTIONS request: '), $this->request_vars); }
         die();
      }

      $this->execute();
   }

   private function get_req_key($name) {
      if(key_exists($name, $this->request_vars)) {
         return($this->request_vars[$name]);
      } else {
         return null;
      }
   }

   private function get_hdr_key($name) {
      if(key_exists($name, $this->request_headers)) {
         return($this->request_headers[$name]);
      } else {
         return null;
      }
   }

   private function get_srv_key($name) {
      if(key_exists($name, $this->server)) {
         return($this->server[$name]);
      } else {
         return null;
      }
   }

   protected function execute() {
      if (!empty($this->debug)) { $this->trace(3, sprintf("%s - %s", __METHOD__ , '1. Validating user permissions...')); }
      $this->validate_user_permissions();
      if (!empty($this->debug)) { $this->trace(3, sprintf("%s - %s", __METHOD__ , '2. Prepare the backend request..')); }
      $this->create_request();
      if (!empty($this->debug)) { $this->trace(3, sprintf("%s - %s", __METHOD__ , '3. Perform request.')); }
      $this->do_request();
      if (!empty($this->debug)) { $this->trace(3, sprintf("%s - %s", __METHOD__ , '4. Proxy Reply to client')); }
      $this->send_reply();
      if (!empty($this->debug)) { $this->trace(3, sprintf("%s - %s", __METHOD__ , '5. Done')); }
   }

   protected function validate_user_permissions() {

      if($this->allowed_hostnames === NULL) {
         return;
      }

      if (!empty($this->debug)) { $this->trace(3, sprintf("%s - %s", __METHOD__ , 'Validating request source.')); }
      $host=array();
      /* Validate the request source */
      if ($this->get_srv_key('REMOTE_HOST')) {
         $host = $this->get_srv_key('REMOTE_HOST');
      } elseif ($this->get_srv_key('REMOTE_ADDR')) {
         $host = $this->get_srv_key('REMOTE_ADDR');
      } else {
         if (!empty($host)) {
            if(!in_array($host, $this->allowed_hostnames))
               if (!empty($this->debug)) { $this->trace(3, sprintf("%s - %s", __METHOD__ , 'Access denied')); }
               header("HTTP/1.1 403 Forbidden");
            throw new Exception("Requests from hostname ($host) are not allowed");
            die();
         }
      }
   }

   protected function create_request() { 

      $url = $this->target_host;

      if (isset($this->target_path)) {
         $url = sprintf("%s/%s",$url, $this->target_path);
      }

      /* GET support, it's easy when just piping along the encoded source qry string */
      if($this->request_method === self::GET) {
         if ($this->get_srv_key('QUERY_STRING')) {
            $url = sprintf("%s?%s",$url, $this->get_srv_key('QUERY_STRING'));
         }
      }

      if (!empty($this->debug)) { $this->trace(3, sprintf("%s - result: %s", __METHOD__ , $url)); }

      $this->target_url = $url;

      /* Now parse the client request, filter out what we need and craft a request header for curl */

      $this->backend_request_headers=array();

      foreach($this->request_headers as $key => $header) {
         //(in_array($key, array('Cookie', 'Host', 'Accept-Encoding','Content-Encoding', 'Vary','Content-Length','Connection', 'Pragma','Cache-Control','Expires','Keep-Alive'))) 
         if (in_array($key, array('Cookie', 'Host', 'Accept-Encoding','Content-Encoding', 'Vary','Content-Length','Connection', 'Pragma','Cache-Control','Expires','Keep-Alive'))) {
            if (!empty($this->debug)) { $this->trace(3, sprintf("%s - filtering header : %s", __METHOD__ , $key)); }
            continue;
         }
         $this->backend_request_headers[$key]=$header;
      }
      if (!empty($this->debug)) { $this->trace(5,sprintf("%s - %s: ", __METHOD__ , 'Backend request headers: '), $this->backend_request_headers); } 

      // $this->backend_request_headers;
   }

   protected function do_request() {
      $ch = curl_init($this->target_url);
      $fh=null;

      if (!empty($this->debug)) { $this->trace(3, sprintf("%s - set curl %s options", __METHOD__ , $this->request_method)); }

      /* Enable the decoding of output for all methods */
      curl_setopt($ch, CURLOPT_ENCODING, "");

      /* POST */
      if($this->request_method === self::POST) {
         curl_setopt($ch, CURLOPT_POST, true);
         curl_setopt($ch, CURLOPT_POSTFIELDS, $this->request_body);
      } elseif($this->request_method === self::PUT) {
         /* PUT */
         /** 
          * Great article on making PUT and delete work:
          * http://stackoverflow.com/questions/2153650/how-to-start-a-get-post-put-delete-request-and-judge-request-type-in-php
          */

         $fh = fopen('php://memory', 'rw');

         $requestLength = strlen($this->request_body);

         fwrite($fh, $this->request_body);
         rewind($fh);

         curl_setopt($ch, CURLOPT_PUT, true);
         curl_setopt($ch, CURLOPT_INFILE, $fh);
         curl_setopt($ch, CURLOPT_INFILESIZE, $requestLength);
         if (is_resource($fh)) {
            fclose($fh);
         }
      } elseif($this->request_method === self::DELETE) {
         /* DELETE */
         curl_setopt($ch, CURLOPT_CUSTOMREQUEST, self::DELETE);
      } else {
         curl_setopt($ch, CURLOPT_CUSTOMREQUEST, self::GET);
      }

      /* TRUE to include the header in the output. */
      curl_setopt($ch, CURLOPT_HEADER, true);
      /* TRUE to include the sent header in the curl_info output, great debug aid */
      curl_setopt($ch, CURLINFO_HEADER_OUT, true);

      curl_setopt($ch, CURLOPT_USERAGENT, $this->get_srv_key('HTTP_USER_AGENT'));

      /* TRUE to return the transfer as a string of the return value of curl_exec() instead of outputting it out directly. */
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

      if (!empty($this->debug)) { $this->trace(5,sprintf("%s - %s", __METHOD__ , 'Setting curl cookie')); } 
      if (!empty($this->request_cookies)) {
         // curl_setopt($ch, CURLOPT_COOKIE, $this->get_req_key('Cookie'));
         curl_setopt($ch, CURLOPT_COOKIE, $this->request_cookies );
      }

      /* We accept compressed input from the backend */ 
      // curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept-Encoding: gzip'));
      $this->backend_request_headers['Accept-Encoding']='gzip'; // FIXME

      /* An array of HTTP header fields to set, in the format array('Content-type: text/plain', 'Content-length: 100') */
      
      if (!empty($this->debug)) { $this->trace(5,sprintf("%s - %s: ", __METHOD__ , 'Using following headers for curl backend call'), $this->backend_request_headers); } 
      curl_setopt($ch, CURLOPT_HTTPHEADER, $this->backend_request_headers);

/*
     // Accept: 
      curl_setopt($this->ch, CURLOPT_HTTPHEADER, array('HTTP_ACCEPT_LANGUAGE: UTF-8', 'ACCEPT: application/json'));
 */

      if (isset($this->settings['curl_connecttimeout'])) {
         curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $this->settings['curl_connecttimeout']);
      }

      if (isset($this->settings['curl_connecttimeout_ms'])) {
         curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS, $this->settings['curl_connecttimeout_ms']);
      }

      if (!empty($this->debug)) { $this->trace(5,sprintf("%s - %s", __METHOD__ , 'Calling backend now!')); } 

      $this->backend_output = curl_exec($ch);
      $this->backend_curl_info = curl_getinfo($ch);

      if (!empty($this->debug)) { $this->trace(4, sprintf("%s - CURL curl_getinfo output: ", __METHOD__), $this->backend_curl_info); } 
   }

   protected function send_reply() {
      if (!$this->backend_curl_info['http_code']==200) {
         /*
         if (preg_match("/utf-8/", strtolower($this->backend_curl_info['content_type']), $matches)) {
            if (!empty($matches[0])) {
               $contents = utf8_encode($this->backend_output);
            }
         } else {
            $contents = $this->backend_output;
         }
          */

         // echo $this->backend_output;
         //ob_end_flush();
      }
      if (!empty($this->debug)) { $this->trace(5,sprintf("%s - %s", __METHOD__ , 'Splitting header/body of curl reply')); } 

      list( $headers, $this->backend_response_body) =  explode("\r\n\r\n", $this->backend_output, 2);
      // Can also be done like this (but keeps the \r\n\r\n somewhere in the resultset):
      // $header=substr($result,0,curl_getinfo($ch,CURLINFO_HEADER_SIZE));
      // $body=substr($result,curl_getinfo($ch,CURLINFO_HEADER_SIZE));

      /* I don't like the pecl one ...
      if(function_exists('http_parse_headers')) {
         $this->backend_response_headers = http_parse_headers($headers);
      }
      * */
      if (!empty($this->debug)) { $this->trace(5,sprintf("%s - %s", __METHOD__ , 'Parsing reply headers')); } 
      $this->backend_response_headers = $this->custom_http_parse_headers($headers);
      if (!empty($this->debug)) { $this->trace(4, sprintf("%s - Backend headers", __METHOD__), $this->backend_response_headers); }

      //if (!empty($this->debug)) { $this->trace(4, sprintf("%s - backend body", __METHOD__)); }
      if (!empty($this->debug)) { $this->trace(4, sprintf("%s - \tlength: %s", __METHOD__, strlen($this->backend_response_body))); }

      if (!empty($this->debug)) { $this->trace(5,sprintf("%s - %s", __METHOD__ , 'Sending HTTP status header')); } 
      header(sprintf("HTTP/1.1 %d %s",$this->backend_curl_info['http_code'],$this->get_code_definition($this->backend_curl_info['http_code'])));
      if (!empty($this->debug)) { $this->trace(4, sprintf("%s - Sending more headers", __METHOD__)); }

      // Filter out response headers that create errors when we send them back blindly
      //
      
      foreach($this->backend_response_headers as $key => $header) {
         if (in_array($key, array('Server', 'Transfer-Encoding', 'Content-Encoding', 'Vary','Content-Length','Connection','Pragma','Cache-Control','Expires','Keep-Alive'))) {
         //if (in_array($key, array('Server', 'Transfer-Encoding', 'Content-Encoding', 'Vary','Content-Length','Connection'))) 
            continue;
         }

         if (!is_array($header)) {
            $hd = sprintf("%s: %s", $key, $header);
         } else {
            $hd = sprintf("%s: %s",$key, implode(', ',$header));
         }
         if (!empty($this->debug)) { $this->trace(4, sprintf("%s - sending header : %s", __METHOD__, $hd)); }
         header($hd,true);
      }

      /* de-cachy-fy the headers 
       * Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0
       */
      $headexpires = gmdate('D, d M Y H:i:s') . " GMT";
      header(sprintf("Pragma: no-cache"),true);
      header(sprintf("Last-Modified: %s", $headexpires),true);
      header(sprintf("Expires: %s" , $headexpires),true);
      header(sprintf("Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0"),true);

      //header(sprintf("Cache-Control: post-check=0, pre-check=0", false),true);
      /*
      */

      if (!empty($this->debug)) { $this->trace(4, sprintf("%s - Done with the headers", __METHOD__)); }
      // var_dump(headers_list());
      // exit;

      if (isset($this->backend_response_body)) {
         if (!empty($this->debug)) { $this->trace(4, sprintf("%s - BODY: %s", __METHOD__, $this->backend_response_body)); }
         echo $this->backend_response_body;
      }
   }

   protected function setErrorHandlers() {
      set_error_handler(array($this, 'handle_error'));
      set_exception_handler(array($this, 'handle_exception'));
   }

   /**
    * A callback method for PHP's set_error_handler function. Used to handle
    *  application-wide errors
    * @param int       $code
    * @param string    $message
    * @param string    $file
    * @param int       $line
    */
   public function handle_error($code, $message, $file, $line) {
      // Be scarse on error info
      // $this->send_fatal_error("Fatal proxy Error: '$message' in $file:$line");
      $this->send_fatal_error("Fatal Error: '$message'");
   }

   /**
    * A callback method for PHP's set_exception_handler function. Used to
    *  handle application-wide exceptions.
    * @param Exception $exception The exception being thrown
    */
   public function handle_exception(Exception $exception)
      {
      $this->send_fatal_error("Fatal Exception: '" . $exception->getMessage());
      /*
       * I don't want to hand out line information to an end user
       . "' in "
       . $exception->getFile()
       . ":"
       . $exception->getLine());
       */
      }

   /**
    * Display a fatal error to the user. This will halt execution.
    * @param string $message
    */
   protected static function send_fatal_error($message) {
      die($message);
   }

   private function get_code_definition($code) {
      // see http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html RFC2616
      // [Informational 1xx]
      $def=array(
         '100'=>'Continue',
         '101'=>'Switching Protocols',
         // [Successful 2xx]
         '200'=>'OK',
         '201'=>'Created',
         '202'=>'Accepted',
         '203'=>'Non-Authoritative Information',
         '204'=>'No Content',
         '205'=>'Reset Content',
         '206'=>'Partial Content',
         // [Redirection 3xx]
         '300'=>'Multiple Choices',
         '301'=>'Moved Permanently',
         '302'=>'Found',
         '303'=>'See Other',
         '304'=>'Not Modified',
         '305'=>'Use Proxy',
         '306'=>'Unused',
         '307'=>'Temporary Redirect',
         // [Client Error 4xx]
         '400'=>'Bad Request',
         '401'=>'Unauthorized',
         '402'=>'Payment Required',
         '403'=>'Forbidden',
         '404'=>'Not Found',
         '405'=>'Method Not Allowed',
         '406'=>'Not Acceptable',
         '407'=>'Proxy Authentication Required',
         '408'=>'Request Timeout',
         '409'=>'Conflict',
         '410'=>'Gone',
         '411'=>'Length Required',
         '412'=>'Precondition Failed',
         '413'=>'Request Entity Too Large',
         '414'=>'Request-URI Too Long',
         '415'=>'Unsupported Media Type',
         '416'=>'Requested Range Not Satisfiable',
         '417'=>'Expectation Failed',
         // [Server Error 5xx]
         '500'=>'Internal Server Error',
         '501'=>'Not Implemented',
         '502'=>'Bad Gateway',
         '503'=>'Service Unavailable',
         '504'=>'Gateway Timeout',
         '505'=>'HTTP Version Not Supported'
      );
   }


   private function custom_http_parse_headers( $header ) {
      $retVal = array();
      $fields = explode("\r\n", preg_replace('/\x0D\x0A[\x09\x20]+/', ' ', $header));
      foreach( $fields as $field ) {
         if( preg_match('/([^:]+): (.+)/m', $field, $match) ) {
            $match[1] = preg_replace('/(?<=^|[\x09\x20\x2D])./e', 'strtoupper("\0")', strtolower(trim($match[1])));
            if( isset($retVal[$match[1]]) ) {
               $retVal[$match[1]] = array($retVal[$match[1]], $match[2]);
            } else {
               $retVal[$match[1]] = trim($match[2]);
            }
         }
      }
      return $retVal;
   }

   private function trace($level, $msg) {
      if (empty($this->debug) || empty($this->verbose) || empty($level) || empty($msg)) { return; }

      $out_array = array ();
      $numargs = func_num_args();
      if ($numargs == 3) {
         $out_array = func_get_arg(2);
         if (!is_array($out_array)) {
            $out_array = array();
         }
      }

      $DateTime=@date('Y-m-d H:i:s', time());

      if ( $level <= $this->verbose ) {
         $mylvl=NULL;
         switch($level) {
            case 0:
               $mylvl ="error";
               break;
            case 1:
               $mylvl ="core ";
               break;
            case 2:
               $mylvl ="info ";
               break;
            case 3:
               $mylvl ="notic";
               break;
            case 4:
               $mylvl ="verbs";
               break;
            case 5:
               $mylvl ="dtail";
               break;
            default :
               $mylvl ="exec ";
               break;
         }
         $content = $DateTime. " [" .  posix_getpid() ."]:[" . $level . "]" . $mylvl . " - " . $msg . "\n";
         if (count($out_array)) {
            foreach($out_array as $key => $val) {
               $content .= $DateTime. " [" .  posix_getpid() ."]:[" . $level . "]" . $mylvl . " - \t\t" . $key ." => " . $val . "\n";
            }
         }
         if (is_resource($this->fp_logfile)) {
            fwrite($this->fp_logfile, $content);
         } else {
            echo $content;
         }
      }
   }

   public function __destruct() {
      if (is_resource($this->fp_logfile)) {
         fclose($this->fp_logfile);
      }
   }
}
?>
