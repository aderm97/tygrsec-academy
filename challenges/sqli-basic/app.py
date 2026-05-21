from flask import Flask, request, render_template_string, session
import sqlite3
import os
import secrets

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

# Database setup
def init_db():
    conn = sqlite3.connect('/tmp/app.db')
    c = conn.cursor()
    
    # Create tables
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY, username TEXT, password TEXT, is_admin INTEGER)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS posts
                 (id INTEGER PRIMARY KEY, title TEXT, content TEXT, user_id INTEGER)''')
    
    # Insert sample data
    flag = os.environ.get('FLAG', 'flag{sql_1nj3ct10n_bypas5_auth_99}')
    c.execute("INSERT OR IGNORE INTO users (id, username, password, is_admin) VALUES (1, 'admin', 'super_secret_admin_password', 1)")
    c.execute("INSERT OR IGNORE INTO users (id, username, password, is_admin) VALUES (2, 'user', 'password123', 0)")
    c.execute("INSERT OR IGNORE INTO posts (id, title, content, user_id) VALUES (1, 'Welcome', 'Welcome to the blog!', 1)")
    c.execute("INSERT OR IGNORE INTO posts (id, title, content, user_id) VALUES (2, 'Secret', ?, 1)", (flag,))
    
    conn.commit()
    conn.close()

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
                <span>SECURE LAB MODE: Parameterized SQL Query Enforced</span>
            </div>
            <span style="font-size: 0.8em; opacity: 0.85; background: #10b98125; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-family: monospace;">Patched</span>
        </div>
        '''
    else:
        return '''
        <div style="background-color: #ef444415; border: 1px solid #ef4444; color: #f87171; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.9em; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>VULNERABLE LAB MODE: Direct String Concatenation Active</span>
            </div>
            <span style="font-size: 0.8em; opacity: 0.85; background: #ef444425; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-family: monospace;">Vulnerable</span>
        </div>
        '''

@app.route('/')
def index():
    banner = get_banner()
    return render_template_string(f'''
<!DOCTYPE html>
<html>
<head>
    <title>Secure Blog</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }}
        .search-box {{ margin: 20px 0; }}
        input[type="text"] {{ padding: 10px; width: 300px; }}
        input[type="submit"] {{ padding: 10px 20px; }}
        .result {{ padding: 10px; margin: 10px 0; background: #f0f0f0; border-radius: 5px; }}
        .hint {{ color: #666; font-size: 0.9em; }}
    </style>
</head>
<body>
    {banner}
    <h1>Secure Blog Search</h1>
    <p class="hint">Search for posts by title</p>
    
    <div class="search-box">
        <form method="GET" action="/search">
            <input type="text" name="q" placeholder="Search posts..." required>
            <input type="submit" value="Search">
        </form>
    </div>
    
    <p><small>Hint: Try using single quotes in your search</small></p>
</body>
</html>
    ''')

@app.route('/search')
def search():
    query = request.args.get('q', '')
    banner = get_banner()
    
    # Database logic
    conn = sqlite3.connect('/tmp/app.db')
    c = conn.cursor()
    
    try:
        if session.get('secure', False):
            # SECURE: Parameterized query
            sql = "SELECT title, content FROM posts WHERE title LIKE ?"
            c.execute(sql, (f'%{query}%',))
        else:
            # VULNERABLE: Direct string concatenation
            sql = "SELECT title, content FROM posts WHERE title LIKE '%" + query + "%'"
            c.execute(sql)
            
        results = c.fetchall()
        
        output = f'''
<!DOCTYPE html>
<html>
<head>
    <title>Search Results</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 30px auto; padding: 20px; background: #0f172a; color: #e2e8f0; }}
        .result {{ padding: 15px; margin: 15px 0; background: #1e293b; border: 1px solid #334155; border-radius: 6px; }}
        h3 {{ margin-top: 0; color: #38bdf8; }}
        a {{ color: #38bdf8; text-decoration: none; }}
        a:hover {{ text-decoration: underline; }}
    </style>
</head>
<body>
    {banner}
'''
        if session.get('secure', False):
            output += '''
            <div style="background-color: #10b98115; border: 1px solid #10b981; color: #34d399; padding: 12px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 0.95em;">
                Secure Verification Flag: <strong style="color: #fff; background: #10b981; padding: 2px 8px; border-radius: 4px;">flag{sqli_secure_prepared_statements_200}</strong>
            </div>
            '''

        output += '<h2>Search Results</h2>'

        if results:
            for title, content in results:
                output += f'<div class="result"><h3>{title}</h3><p>{content}</p></div>'
        else:
            output += '<p>No results found.</p>'
        
        output += f'<p><a href="/">← Back to search</a></p>'
        output += f'<p style="opacity: 0.6; font-size: 0.85em; font-family: monospace;">Debug: Query executed: {sql}</p></body></html>'
        
        return render_template_string(output)
        
    except sqlite3.Error as e:
        err_output = f'''
<!DOCTYPE html>
<html>
<head>
    <title>Database Error</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 30px auto; padding: 20px; background: #0f172a; color: #e2e8f0; }}
        a {{ color: #38bdf8; text-decoration: none; }}
    </style>
</head>
<body>
    {banner}
    <div style="background-color: #ef444415; border: 1px solid #ef4444; color: #f87171; padding: 16px; border-radius: 6px; margin: 15px 0; font-family: monospace;">
        <p style="margin-top: 0; font-weight: bold;">SQL Injection Triggered successfully!</p>
        <p style="margin-bottom: 12px; font-size: 0.9em; opacity: 0.95;">Database Error: {e}</p>
        <div style="background-color: #ef444425; padding: 10px; border-radius: 4px; border: 1px dashed #ef4444; font-size: 0.95em;">
            Vulnerable Flag: <strong style="color: #fff; background: #ef4444; padding: 2px 8px; border-radius: 4px;">flag{sqli_vulnerable_bypass_success_200}</strong>
        </div>
    </div>
    <p><a href="/">← Back to search</a></p>
</body>
</html>
'''
        return render_template_string(err_output)
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=8080, debug=True)