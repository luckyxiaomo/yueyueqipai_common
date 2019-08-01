const Q = 37;
const A = 35;
function calc(g, n, p) {
    return g ^ n % p;
}
function gen_keys() {
    var pri = '';
    var pub = '';
    for (var i = 0; i < 36; ++i) {
        var priSub = Math.floor(Math.random() * Q);
        var pubSub = calc(A, priSub, Q);
        pri += String.fromCharCode(priSub);
        pub += String.fromCharCode(pubSub);
    }
    pri = new Buffer(pri, 'utf8').toString('base64');
    pub = new Buffer(pub, 'utf8').toString('base64');
    return {
        public_key: pub,
        private_key: pri
    }
}
function secret(pri_key, other_pub) {
    var secret = '';
    var pri = new Buffer(pri_key, 'base64').toString('utf8');
    var pub = new Buffer(other_pub, 'base64').toString('utf8');
    for (var i = 0; i < 36; ++i) {
        var r = pri.charCodeAt(i);
        var b = pub.charCodeAt(i);
        var s = calc(b, r, Q);
        secret += String.fromCharCode(s);
    }
    secret = new Buffer(secret, 'utf8').toString('base64');
    return secret
}
function bin2hex(bin) {
    var i = 0, l = bin.length, chr, hex = '';
    for (i; i < l; ++i) {
        chr = bin.charCodeAt(i).toString(16);
        hex += chr.length < 2 ? '0' + chr : chr;
    }
    return hex;
}
function hex2bin(hex) {
    var bytes = [], str;
    for (var i = 0; i < hex.length - 1; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return String.fromCharCode.apply(String, bytes);
}
function rc4(str, key) {
    var s = [], j = 0, x, res = '';
    for (var i = 0; i < 256; i++) {
        s[i] = i;
    }
    for (i = 0; i < 256; i++) {
        j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
    }
    i = 0;
    j = 0;
    for (var y = 0; y < str.length; y++) {
        i = (i + 1) % 256;
        j = (j + s[i]) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
        res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
    }
    return res;
}
function hex2b64(data) {
    return new Buffer(data, 'hex').toString('base64');
}
function b642hex(data) {
    return new Buffer(data, 'base64').toString('hex');
}
function rc4encryption(data, key) {
    return hex2b64(bin2hex(rc4(data, key)));
}
function rc4decryption(data, key) {
    return rc4(hex2bin(b642hex(data)), key);
}
module.exports = {
    gen_key: gen_keys,
    secret: secret,
    encrypto: rc4encryption,
    decrypto: rc4decryption
}