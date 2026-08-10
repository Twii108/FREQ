def wrap_cors_proxy(url):
    """
    Automatically routes external HTTPS CDN image URLs through images.weserv.nl CORS proxy
    to prevent browsers from blocking them in mixed content / local dev settings.
    """
    if not url:
        return url
    url_str = str(url).strip()
    if url_str.startswith('http://') or url_str.startswith('https://'):
        # If it is hosted locally on the developer laptop, do not wrap it
        if 'localhost' in url_str or '127.0.0.1' in url_str or '192.168.' in url_str:
            return url_str
        
        # Strip protocol prefix as expected by weserv.nl proxy API
        clean_url = url_str.replace('https://', '').replace('http://', '')
        return f"https://images.weserv.nl/?url={clean_url}&we=1"
    
    return url_str
