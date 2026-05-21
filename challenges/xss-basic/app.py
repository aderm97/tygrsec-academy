from flask import Flask, request, render_template_string, session
import os
import html

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

flag = os.environ.get('FLAG', 'flag{xss_reflected_cookie_steal_88}')

comments = [
    {"name": "Admin", "message": "Welcome to the guestbook!", "admin": True}
]

@app.before_request
def set_mode():
    if 'secure' in request.args:
        session['secure'] = request.args.get('secure') == 'true'
    elif 'secure' not in session:
        session['secure'] = False

def get_banner():
    is_secure = session.get('secure', False)
    if is_secure:
        return '''
        <div style="background-color: #10b98115; border: 1px solid #10b981; color: #34d399; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.9em; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>SECURE LAB MODE: HTML Input Sanitization & Escaping Active</span>
            </div>
            <span style="font-size: 0.8em; opacity: 0.85; background: #10b98125; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-family: monospace;">Patched</span>
        </div>
        '''
    else:
        return '''
        <div style="background-color: #ef444415; border: 1px solid #ef4444; color: #f87171; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.9em; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>VULNERABLE LAB MODE: Raw HTML Direct DOM Injection Enabled</span>
            </div>
            <span style="font-size: 0.8em; opacity: 0.85; background: #ef444425; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-family: monospace;">Vulnerable</span>
        </div>
        '''

@app.route('/')
def index():
    query = request.args.get('search', '')
    banner = get_banner()
    
    search_results = ""
    xss_flag_html = ""
    
    if query:
        if session.get('secure', False):
            safe_query = html.escape(query)
            search_results = f"<p>Search results for: {safe_query}</p>"
        else:
            search_results = f"<p>Search results for: {query}</p>"
            low_query = query.lower()
            if '<script' in low_query or 'onload' in low_query or 'onerror' in low_query or 'javascript:' in low_query or '<img' in low_query:
                xss_flag_html = '''
                <div style="background-color: #ef444415; border: 1px solid #ef4444; color: #f87171; padding: 16px; border-radius: 6px; margin: 15px 0; font-family: monospace; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <p style="margin-top: 0; font-weight: bold;">Reflected Cross-Site Scripting (XSS) Triggered!</p>
                    <div style="background-color: #ef444425; padding: 10px; border-radius: 4px; border: 1px dashed #ef4444; font-size: 0.95em;">
                        Vulnerable Flag: <strong style="color: #fff; background: #ef4444; padding: 2px 8px; border-radius: 4px;">flag{xss_vulnerable_reflected_exploit_200}</strong>
                    </div>
                </div>
                '''
    
    if session.get('secure', False):
        xss_flag_html = '''
        <div style="background-color: #10b98115; border: 1px solid #10b981; color: #34d399; padding: 12px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 0.95em;">
            Secure Verification Flag: <strong style="color: #fff; background: #10b981; padding: 2px 8px; border-radius: 4px;">flag{xss_secure_html_escaped_success_200}</strong>
        </div>
        '''

    comments_html = ""
    for c in comments:
        name = c['name']
        message = c['message']
        if session.get('secure', False):
            name = html.escape(name)
            message = html.escape(message)
            
        comments_html += f"""
        <div class="comment">
            <strong>{name}</strong>: {message}
        </div>
        """
    
    return render_template_string(f'''
<!DOCTYPE html>
<html>
<head>
    <title>Guestbook</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 30px auto; padding: 20px; background: #0f172a; color: #e2e8f0; }}
        .comment {{ padding: 15px; margin: 10px 0; background: #1e293b; border: 1px solid #334155; border-radius: 6px; }}
        .comment strong {{ color: #38bdf8; }}
        input, textarea {{ padding: 10px; margin: 5px; width: 300px; background: #1e293b; border: 1px solid #334155; color: white; border-radius: 4px; }}
        button {{ padding: 10px 20px; background: #38bdf8; color: #0f172a; font-weight: bold; border: none; cursor: pointer; border-radius: 4px; }}
        button:hover {{ background: #0ea5e9; }}
        .search {{ margin: 20px 0; }}
    </style>
</head>
<body>
    {banner}
    {xss_flag_html}
    <h1>Guestbook</h1>
    
    <div class="search">
        <h3>Search Messages</h3>
        <form method="GET">
            <input type="text" name="search" placeholder="Search...">
            <button type="submit">Search</button>
        </form>
        {search_results}
    </div>
    
    <h3>Leave a Message</h3>
    <form method="POST" action="/post">
        <input type="text" name="name" placeholder="Your name" required><br>
        <textarea name="message" placeholder="Your message" required></textarea><br>
        <button type="submit">Post</button>
    </form>
    
    <h3>Messages</h3>
    {comments_html}
</body>
</html>
    ''')

@app.route('/post', methods=['POST'])
def post():
    name = request.form.get('name', '')
    message = request.form.get('message', '')
    
    comments.append({"name": name, "message": message, "admin": False})
    
    # Check if admin cookie is set (simulating admin bot)
    if request.cookies.get('admin') == 'true' and not session.get('secure', False):
        # This would be the admin bot viewing the page
        if '<script>' in message or 'javascript:' in message.lower():
            # XSS detected - give flag
            comments.append({"name": "Flag Bot", "message": f"XSS detected! Here's your flag: {flag}", "admin": True})
    
    return '<p>Posted! <a href="/">Back</a></p>'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)