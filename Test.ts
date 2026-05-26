const response = await fetch(TA_DOMAIN+ALT_ENDPOINT, {
    method: 'POST',
    headers: {
        "Content-Type": "application/octet-stream",
        "User-Agent": TA_USERAGENT,
        "Connection": "keep-alive",
        "Accept": "*/*",
        "Accept-Language": "en-us",
        "Accept-Encoding": "gzip, deflate, br"
    },
    body: re!
});