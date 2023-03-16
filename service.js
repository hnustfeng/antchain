vpn_eval((function(){

    // SHA-1 Cryptographic Hash Algorithm 
    // From http://www.movable-type.co.uk/
    // Example: f.hash.value = getHashCode(f.message.value)
    // Note SHA-1 hash of ��abc�� should be ��a9993e364706816aba3e25717850c26c9cd0d89d��
    //
    function getHashCode(msg){
        // constants [4.2.1]
        var K = new Array(0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6);
    
        // PREPROCESSING  
        msg += String.fromCharCode(0x80);  // add trailing '1' bit to string [5.1.1]
    
        // convert string msg into 512-bit/16-integer blocks arrays of ints [5.2.1]
        var l = Math.ceil(msg.length/4) + 2;  // long enough to contain msg plus 2-word length
        var N = Math.ceil(l/16);              // in N 16-int blocks
        var M = new Array(N);
    
        for (var i=0; i<N; i++) {
            M[i] = new Array(16);
            for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
                M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) | 
                          (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
            } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
        }
        // add length (in bits) into final pair of 32-bit integers (big-endian) [5.1.1]
        M[N-1][14] = ((msg.length-1) >>> 30) * 8;
        M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;
    
        // set initial hash value [5.3.1]
        var H0 = 0x67452301;
        var H1 = 0xefcdab89;
        var H2 = 0x98badcfe;
        var H3 = 0x10325476;
        var H4 = 0xc3d2e1f0;
    
        // HASH COMPUTATION [6.1.2]
    
        var W = new Array(80); var a, b, c, d, e;
        for (var i=0; i<N; i++) {
            // 1 - prepare message schedule 'W'
            for (var t=0;  t<16; t++) W[t] = M[i][t];
            for (var t=16; t<80; t++) W[t] = ROTL(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1);
    
            // 2 - initialise five working variables a, b, c, d, e with previous hash value
            a = H0; b = H1; c = H2; d = H3; e = H4;
    
            // 3 - main loop
            for (var t=0; t<80; t++) {
                var s = Math.floor(t/20); // seq for blocks of 'f' functions and 'K' constants
                T = (ROTL(a,5) + fHexStr(s,b,c,d) + e + K[s] + W[t]) & 0xffffffff;
                e = d;
                d = c;
                c = ROTL(b, 30);
                b = a;
                a = T;
            }
    
            // 4 - compute the new intermediate hash value
            H0 = (H0+a) & 0xffffffff;  // note 'addition modulo 2^32'
            H1 = (H1+b) & 0xffffffff; 
            H2 = (H2+c) & 0xffffffff; 
            H3 = (H3+d) & 0xffffffff; 
            H4 = (H4+e) & 0xffffffff;
        }
        return H0.toHexStr() + H1.toHexStr() + H2.toHexStr() + H3.toHexStr() + H4.toHexStr();
    }
    
    //
    // function 'f' [4.1.1]
    //
    function fHexStr(s, x, y, z){
        switch(s) {
        case 0: return (x & y) ^ (~x & z);
        case 1: return x ^ y ^ z;
        case 2: return (x & y) ^ (x & z) ^ (y & z);
        case 3: return x ^ y ^ z;
        }
    }
    
    //
    // rotate left (circular left shift) value x by n positions [3.2.5]
    //
    function ROTL(x, n){
        return (x<<n) | (x>>>(32-n));
    }
    
    //
    // extend Number class with a tailored hex-string method 
    //   (note toString(16) is implementation-dependant, and  
    //   in IE returns signed numbers when used on full words)
    //
    Number.prototype.toHexStr = function(){
        var s="", v;
        for (var i=7; i>=0; i--) { v = (this>>>(i*4)) & 0xf; s += v.toString(16); }
        return s;
    }
    
    
    //
    // 'Block' Tiny Encryption Algorithm
    //
    // Algorithm: David Wheeler & Roger Needham, Cambridge University Computer Lab
    //            http://www.cl.cam.ac.uk/ftp/papers/djw-rmn/djw-rmn-tea.html (1994)
    //            http://www.cl.cam.ac.uk/ftp/users/djw3/xtea.ps (1997)
    //            http://www.cl.cam.ac.uk/ftp/users/djw3/xxtea.ps (1998)
    //
    // JavaScript implementation: Chris Veness, Movable Type Ltd: www.movable-type.co.uk
    //
    // Example:  f.encrypted.value = ciferText = encryptCode(f.val.value, f.key.value)
    //			 f.decrypted.value = decryptCode(ciferText, f.key.value)
    //
    // encrypt: Use 128 bits (16 chars) of string 'key' to encrypt string 'val'
    //          (note key & val must be strings not string objects)
    //
    // Return encrypted text as string
    //
    function encryptCode(val, key)
    {
        // 'escape' val so chars outside ISO-8859-1 work in single-byte packing, but keep spaces as
        // spaces (not '%20') so encrypted text doesn't grow too long!
        var v = strToLongs(escape(val).replace(/%20/g,' '));
        var k = strToLongs(key.slice(0,16));
        var n = v.length;
    
        if (n == 0) return("");  // nothing to encrypt
        if (n == 1) v[n++] = 0;  // algorithm doesn't work for n<2 so fudge by adding nulls
    
        // TEA routine as per Wheeler & Needham, Oct 1998
    
        var z = v[n-1], y = v[0], delta = 0x9E3779B9;
        var mx, e, q = Math.floor(6 + 52/n), sum = 0;
    
        while (q-- > 0) {  // 6 + 52/n operations gives between 6 & 32 mixes on each word
            sum += delta;
            e = sum>>>2 & 3;
            for (var p = 0; p < n-1; p++) {
                y = v[p+1];
                mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z)
                z = v[p] += mx;
            }
            y = v[0];
            mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z)
            z = v[n-1] += mx;
        }
    
        // note: unsigned right-shift '>>>' is used in place of original '>>', due to lack of 
        // 'unsigned' type declaration in JavaScript (thanks to Karsten Kraus @ swr3 for this)
    
        return longsToStr(v);  // if control chars & nulls cause difficulties use: return(escape(longsToStr(v)));
    }
    
    
    //
    // decrypt: use 128 bits of string 'key' to decrypt string 'val' encrypted as per above
    //
    function decryptCode(val, key)
    {
        var v = strToLongs(val);  // if encrypt used escape(), use: var v = strToLongs(unescape(val));
        var k = strToLongs(key.slice(0,16));
        var n = v.length;
    
        if (n == 0) return("");
    
        // TEA routine as per Wheeler & Needham, Oct 1998
    
        var z = v[n-1], y = v[0], delta = 0x9E3779B9;
        var mx, e, q = Math.floor(6 + 52/n), sum = q*delta;
    
        while (sum != 0) {
            e = sum>>>2 & 3;
            for (var p = n-1; p > 0; p--) {
                z = v[p-1];
                mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z)
                y = v[p] -= mx;
            }
            z = v[n-1];
            mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z)
            y = v[0] -= mx;
            sum -= delta;
        }
    
        var s = longsToStr(v);
        if (s.indexOf("\x00") != -1) {
            // strip trailing null chars resulting from filling 4-char blocks
            s = s.substr(0, s.indexOf("\x00"));
        }
    
        return unescape(s);
    }
    
    
    function strToLongs(s) {  // convert string to array of longs, each containing 4 chars
        // note chars must be within ISO-8859-1 (with Unicode code-point < 256) to fit 4/long
        var l = new Array(Math.ceil(s.length/4))
        for (var i=0; i<l.length; i++) {
            // note little-endian encoding - endianness is irrelevant as long as 
            // it is the same in longsToStr() 
            l[i] = s.charCodeAt(i*4) + (s.charCodeAt(i*4+1)<<8) + 
                   (s.charCodeAt(i*4+2)<<16) + (s.charCodeAt(i*4+3)<<24);
        }
        return l;  // note running off the end of the string generates nulls since 
    }              // bitwise operators treat NaN as 0
    
    
    function longsToStr(l) {  // convert array of longs back to string
        var a = new Array(l.length);
        for (var i=0; i<l.length; i++) {
            a[i] = String.fromCharCode(l[i] & 0xFF, l[i]>>>8 & 0xFF, 
                                       l[i]>>>16 & 0xFF, l[i]>>>24 & 0xFF);
        }
        return a.join('');  // use Array.join() rather than repeated string appends for efficiency
    }
    
    
    /* base64 Encoding/Decoding base64����/���� 
     * http://www.51one.net  
     * 2005-04-15
     * For Example :
     * <textarea name="theText" cols="40" rows="6"></textarea><br>
     * <input type="button" name="encode" value="Encode to base64"
        onClick="document.base64Form.theText.value=encode64(document.base64Form.theText.value);">
     * <input type="button" name="decode" value="Decode from base64" 
        onClick="document.base64Form.theText.value=decode64(document.base64Form.theText.value);">
     */
    
    var keyStr = "ABCDEFGHIJKLMNOP" +
                    "QRSTUVWXYZabcdef" +
                    "ghijklmnopqrstuv" +
                    "wxyz0123456789+/" +
                    "=";
    
    function encode64(input) {
      input = escape(input);
      var output = "";
      var chr1, chr2, chr3 = "";
      var enc1, enc2, enc3, enc4 = "";
      var i = 0;
    
      do {
         chr1 = input.charCodeAt(i++);
         chr2 = input.charCodeAt(i++);
         chr3 = input.charCodeAt(i++);
    
         enc1 = chr1 >> 2;
         enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
         enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
         enc4 = chr3 & 63;
    
         if (isNaN(chr2)) {
            enc3 = enc4 = 64;
         } else if (isNaN(chr3)) {
            enc4 = 64;
         }
    
         output = output + 
            keyStr.charAt(enc1) + 
            keyStr.charAt(enc2) + 
            keyStr.charAt(enc3) + 
            keyStr.charAt(enc4);
         chr1 = chr2 = chr3 = "";
         enc1 = enc2 = enc3 = enc4 = "";
      } while (i < input.length);
    
      return output;
    }
    
    function decode64(input) {
      var output = "";
      var chr1, chr2, chr3 = "";
      var enc1, enc2, enc3, enc4 = "";
      var i = 0;
    
      // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
      var base64test = /[^A-Za-z0-9\+\/\=]/g;
      if (base64test.exec(input)) {
         alert("There were invalid base64 characters in the input text.\n" +
               "Valid base64 characters are A-Z, a-z, 0-9, ''+'', ''/'', and ''=''\n" +
               "Expect errors in decoding.");
      }
      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    
      do {
         enc1 = keyStr.indexOf(input.charAt(i++));
         enc2 = keyStr.indexOf(input.charAt(i++));
         enc3 = keyStr.indexOf(input.charAt(i++));
         enc4 = keyStr.indexOf(input.charAt(i++));
    
         chr1 = (enc1 << 2) | (enc2 >> 4);
         chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
         chr3 = ((enc3 & 3) << 6) | enc4;
    
         output = output + String.fromCharCode(chr1);
    
         if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
         }
         if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
         }
    
         chr1 = chr2 = chr3 = "";
         enc1 = enc2 = enc3 = enc4 = "";
    
      } while (i < input.length);
    
      return unescape(output);
    }
    //--end --
    
    }
    ).toString().slice(12, -2),"");