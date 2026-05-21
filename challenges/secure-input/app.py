from flask import Flask, request, render_template_string, abort, session
import os

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

# Create flag.txt in the root directory
with open('/flag.txt', 'w') as f:
    f.write('flag{s3cur3_1nput_val1dat10n_succ3ss}')

# Create uploads folder and a sample file
os.makedirs('/var/www/uploads', exist_ok=True)
with open('/var/www/uploads/note.txt', 'w') as f:
    f.write('Welcome to SecureCorp upload center. Only administrators can access /flag.txt.')

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
                <span>SECURE LAB MODE: Canonical Prefix Directory Verification Active</span>
            </div>
            <span style="font-size: 0.8em; opacity: 0.85; background: #10b98125; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-family: monospace;">Patched</span>
        </div>
        '''
    else:
        return '''
        <div style="background-color: #ef444415; border: 1px solid #ef4444; color: #f87171; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.9em; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>VULNERABLE LAB MODE: Naive Path Join Permitting Directory Traversal</span>
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
    <title>SecureCorp Upload Portal</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }}
        .view-box {{ margin: 20px 0; }}
        input[type="text"] {{ padding: 10px; width: 300px; }}
        input[type="submit"] {{ padding: 10px 20px; }}
        .result {{ padding: 20px; background: #f0f0f0; border-radius: 5px; font-family: monospace; white-space: pre-wrap; }}
    </style>
</head>
<body>
    {banner}
    <h1>SecureCorp Upload Portal</h1>
    <p>View static document uploads using their filenames.</p>
    
    <div class="view-box">
        <form method="GET" action="/view">
            <input type="text" name="filename" value="note.txt" required>
            <input type="submit" value="View File">
        </form>
    </div>
</body>
</html>
    ''')

@app.route('/view')
def view_file():
    filename = request.args.get('filename', '')
    banner = get_banner()
    
    if session.get('secure', False):
        # SECURE: Strict canonical path resolution and directory boundary validation
        base_dir = os.path.abspath('/var/www/uploads')
        filepath = os.path.abspath(os.path.join(base_dir, filename))
        if not filepath.startswith(base_dir):
            return render_template_string(f'''
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Security Alert</title>
                    <style>
                        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 30px auto; padding: 20px; background: #0f172a; color: #e2e8f0; }}
                        a {{ color: #38bdf8; text-decoration: none; }}
                    </style>
                </head>
                <body>
                    {banner}
                    <div style="background-color: #10b98115; border: 1px solid #10b981; color: #34d399; padding: 12px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 0.95em;">
                        Secure Verification Flag: <strong style="color: #fff; background: #10b981; padding: 2px 8px; border-radius: 4px;">flag{path_traversal_secure_resolved_200}</strong>
                    </div>
                    <h2 style="color: #ef4444;">Security Exception</h2>
                    <div style="background-color: #ef444415; border: 1px solid #ef4444; color: #f87171; padding: 15px; border-radius: 6px; font-family: monospace; line-height: 1.5;">
                        <strong>Access Denied: Path Traversal Attempt Blocked.</strong><br><br>
                        Attempted query: {filename}<br>
                        Resolved path: {filepath}<br>
                        Authorized base directory: {base_dir}
                    </div>
                    <p><a href="/">← Back</a></p>
                </body>
                </html>
            '''), 403
    else:
        # VULNERABLE: Naive join permitting '../' directory traversal
        filepath = os.path.join('/var/www/uploads', filename)
    
    try:
        # Check traversal success in vulnerable mode
        is_traversal = False
        if not session.get('secure', False) and ('..' in filename or filename.startswith('/')):
            is_traversal = True

        with open(filepath, 'r') as f:
            content = f.read()

        flag_section = ""
        if is_traversal:
            flag_section = '''
            <div style="background-color: #ef444415; border: 1px solid #ef4444; color: #f87171; padding: 16px; border-radius: 6px; margin: 15px 0; font-family: monospace; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <p style="margin-top: 0; font-weight: bold;">Path Traversal Exploited successfully!</p>
                <div style="background-color: #ef444425; padding: 10px; border-radius: 4px; border: 1px dashed #ef4444; font-size: 0.95em;">
                    Vulnerable Flag: <strong style="color: #fff; background: #ef4444; padding: 2px 8px; border-radius: 4px;">flag{path_traversal_vuln_success_200}</strong>
                </div>
            </div>
            '''

        return render_template_string(f'''
            <!DOCTYPE html>
            <html>
            <head>
                <title>File Viewer</title>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 30px auto; padding: 20px; background: #0f172a; color: #e2e8f0; }}
                    .result {{ padding: 20px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; font-family: monospace; white-space: pre-wrap; }}
                    a {{ color: #38bdf8; text-decoration: none; }}
                </style>
            </head>
            <body>
                {banner}
                {flag_section}
                <h2>File Content: {filename}</h2>
                <div class="result">{content}</div>
                <p><a href="/">← Back</a></p>
            </body>
            </html>
        ''')
    except Exception as e:
        return render_template_string(f'''
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 30px auto; padding: 20px; background: #0f172a; color: #e2e8f0; }}
                    a {{ color: #38bdf8; text-decoration: none; }}
                </style>
            </head>
            <body>
                {banner}
                <p style="color: red; font-family: monospace;">Error reading file: {e}</p>
                <p><a href="/">← Back</a></p>
            </body>
            </html>
        '''), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)

