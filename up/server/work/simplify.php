<?php

/*
   Some common mess inside GRB data: test the function on these abominations, it does a fine job filtering these using regex
*/

$housez = array(
      '1;1A;1B;2;AGVL;BGVL',
      '1;2;3;4;5;6;7;8;AB 1;AB 3;AB 4;AB 5;AB 6;AB 7;AB 8',
      'AGLV;AVD1;AVD2',
      'AGVL;AVD1;AVD2',
      '109.00.01;109.01.01',
      '1;2;4;6;7;eL;eR',
      '203;203B;203_1;203_2',
      '285;287',
      '1-3',
      '102;102B',
      '1;2;3;4;5;6;7;8;A;EL;eL;eR',
      '128;128_1;128_2;128_3',
      'DAK',
      'A0001;A0002;A0003;A0004;A0005;A0006;A0007;A0008;A0009;A0010;A0101;A0102;A0103;A0104;A0105;A0106;A0107;A0108;A0109;A0110;A0111;A0112;A0113;A0114;A0115;A0116;A0201;A0202;A0203;A0204;A0205;A0206;A0207;A0208;A0209;A0210;A0211;A0212;A0213;A0214;A0215;A0216;A0301;A0302;A0303;A0304;A0305;A0306;A0307;A0308;A0309;A0310;A0311;A0312;A0313;A0314;A0315;A0316;A0401;A0402;A0403;A0404;A0405;A0406;A0407;A0408;A0409;A0410;A0411;A0412;A0413;A0414;A0415;A0416;A0501;A0502;A0503;A0504;A0505;A0506;A0507;A0508;A0509;B0001;B0002;B0003;B0004;B0101;B0102;B0103;B0104;B0201;B0202;B0203;B0301;B0302;C0001;C0002;C0003;C0101;C0102;C0103;C0201;C0202;C0203;C0301;C0302;C0303;D0001;D0002;D0003;D0004;D0005;D0101;D0102;D0103;D0104;D0105;D0201;D0202;D0203;D0204',
      '1;2;3;4;5;6;7;8;9;10;11;12;13;14;15;16;17;18;19;20;21;22;23;24;25;26;27;28;29;30;31;32;33;34;35;36;37;38;39;40;C',
      '270;270_6',
      '270;270_8',
      '270;270_7',
      '270;270_9',
      '270;270_10',
      '4/00.1;4/02.1;4/02.2;4/02.3;4/02.4;4/02.5;4/02.6;4/02.7;4/02.8;4/02.9;4/03.1;4/03.2;4/03.3;4/03.4;4/03.5;4/03.6;4/03.7;4/03.8;4/03.9;4/04.1;4/04.2;4/04.3;4/04.4;4/04.5;4/04.6;4/04.7;4/04.8;4/04.9;4/05.1;4/05.2;4/05.3;4/05.4;4/05.5;4/05.6;4/05.7;4/05.8;4/05.9;4/06.1;4/2.10;4/2.11;4/2.12;4/2.13;4/2.14;4/2.15;4/3.10;4/3.11;4/3.12;4/3.13;4/3.14;4/3.15;4/3.16;4/4.10;4/4.11;4/4.12;4/4.13;4/4.14;4/4.15;4/4.16;4/5.10;4/5.11;4/5.12;4/5.13;4/5.14;4/5.15;4/5.16',
      '101;102;103;104;105;106;111;112;113;114;115;116;121;122;123;124;125;126;211;212;213;214;215;216;221;222;223;224;225;226;301;302;303;304;305;306;307;311;312;313;314;315;316;317;321;322;323;324;325;326;327;401;402;404;405;406;407;411;412;413;414;415;416;417;422;423;426;427;10A;10B;12C;12D;13F',
      '1;2;3;4;5;12;13;14;15;21;22;23;24;25;31;32;33;34;35;41;49;50;51',
      '5;6;7;9;10B;10A;10C;102B;102C;102D;102G'
);

foreach($housez as $housenumber) {
   echo "RETURN : " . print_r(trimhousenumbers($housenumber),true) . PHP_EOL;
}

function trimhousenumbers ($housenumber) {
   echo "Input: " . $housenumber . PHP_EOL;
   $numbers = preg_split('/;/', $housenumber, -1, PREG_SPLIT_NO_EMPTY);
   asort($numbers);
   natsort($numbers);
   $numbers=array_values($numbers);
   print_r($numbers);

   $hexes= array();
   $output = array();

   $alfa = array();
   $nume = array();

   $first = $last = null;

   foreach ($numbers as $this_number) {
      // filter out numbers with dot in
      $pos = strpos($this_number, '.');
      if ($pos !== false) {
         continue;
      }
      // filter out numbers with / in
      $pos = strpos($this_number, '/');
      if ($pos !== false) {
         continue;
      }

      if (ctype_digit($this_number)) {
         $nume[]=$this_number;
      } elseif(ctype_alnum($this_number)) {
         $alfa[]=$this_number;
      } else {
         // drop whatever else 
      }
   }

   // echo "NUME\n";
   // print_r($nume);

   foreach ($nume as $this_number) {
      if ($first === null) {
         $first = $last = $this_number;
      } 
      if ($last < $this_number - 1) {
         if(is_numeric($this_number)) {
            $output[] = $first == $last ? $first : $first . '-' . $last;
         }
         $first = $last = $this_number;
      } else {
         $last = $this_number;
      }
   }
   //if (count($output)) {
   $output[] = $first == $last ? $first : $first . '-' . $last;
   //}

   //echo "OUTPUT" . PHP_EOL;
   //print_r($output); 

   foreach ($alfa as $this_number) {
      if (!is_integer($this_number)) {
         $this_number=trim($this_number);

         if (preg_match("/([0-9]+)([A-Z+])/ui", $this_number, $match)) {
            // if (preg_match("/[^[:alnum:]]/u", $this_number)) 
            // print_r($match);
            if(isset($match[1])) {
               if(!isset($hexes[$match[1]],$hexes)) {
                  $hexes[$match[1]]=$match[2];
               } else {
                  $hexes[$match[1]].=';'.$match[2];
               }
            }
         }
      }
   }

   //echo "HEXES" . PHP_EOL;
   //print_r($hexes); 
   //exit;

   $res=array();

   foreach ($hexes as $k => $v) {
      $ranges=array();
      $chars = preg_split('/;/', $v, -1, PREG_SPLIT_NO_EMPTY);
      $first = $last = null;
      foreach ($chars as $char) {
         // echo "ORD : (".$char .  ") -> ". ordutf8(strtoupper($char)) . " / " . utf8chr(ordutf8(strtoupper($char)))  . PHP_EOL;
         $this_char=ordutf8(strtoupper($char));

         if ($first === null) {
            $first = $last = $this_char;
         } 
         if ($last < $this_char - 1) {
            $ranges[] = $first == $last ? $first : $first . '-' . $last;
            $first = $last = $this_char;
         } else {
            $last = $this_char;
         }
      }
      $ranges[] = $first == $last ? $first : $first . '-' . $last;
      $res[$k]=$ranges;
   }

   $numstr="";
   $nnum=array();
   foreach($res as $number => $ranges) {
      foreach($ranges as $k => $range) {
         $newnumbers=array();
         $srange = preg_split('/-/', $range, -1, PREG_SPLIT_NO_EMPTY);
         $str_range=array();
         foreach($srange as $kk => $vv) {
            $str_range[]=utf8chr($vv);
         }
         foreach($str_range as $val) {
            $newnumbers[]=sprintf('%s%s',$number, $val);
         }
         $num=join('-', $newnumbers);
         $nnum[]=$num;
      }
   }

   if (is_array($nnum) && is_array($output)) {
      $nn=array_merge($output,$nnum);
      $numstr=join(';', $nn);
      return($numstr);
   } elseif (is_array($output)) {
      return($output);
   } else {
      return(array());
   }  
}

function ordutf8($string, &$offset=0) {
   $code = ord(substr($string, $offset,1)); 
   if ($code >= 128) {        //otherwise 0xxxxxxx
      if ($code < 224) $bytesnumber = 2;                //110xxxxx
      else if ($code < 240) $bytesnumber = 3;        //1110xxxx
      else if ($code < 248) $bytesnumber = 4;    //11110xxx
      $codetemp = $code - 192 - ($bytesnumber > 2 ? 32 : 0) - ($bytesnumber > 3 ? 16 : 0);
      for ($i = 2; $i <= $bytesnumber; $i++) {
         $offset ++;
         $code2 = ord(substr($string, $offset, 1)) - 128;        //10xxxxxx
         $codetemp = $codetemp*64 + $code2;
      }
      $code = $codetemp;
   }
   $offset += 1;
   if ($offset >= strlen($string)) $offset = -1;
   return $code;
}

function utf8chr($u) {
   return mb_convert_encoding('&#' . intval($u) . ';', 'UTF-8', 'HTML-ENTITIES');
}

?>

