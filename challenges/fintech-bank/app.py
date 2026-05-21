from flask import Flask, request, render_template_string, jsonify, session
import time
import threading
import os

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

# Simulated in-memory database
db = {
    "balance": 100,  # Starting balance
    "flag_issued": False
}

db_lock = threading.Lock()

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
                <span>SECURE LAB MODE: Concurrency Lock & Safe Mutex Active</span>
            </div>
            <span style="font-size: 0.8em; opacity: 0.85; background: #10b98125; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-family: monospace;">Patched</span>
        </div>
        '''
    else:
        return '''
        <div style="background-color: #ef444415; border: 1px solid #ef4444; color: #f87171; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.9em; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>VULNERABLE LAB MODE: Concurrent Transfer Without Mutex Lock Enabled</span>
            </div>
            <span style="font-size: 0.8em; opacity: 0.85; background: #ef444425; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-family: monospace;">Vulnerable</span>
        </div>
        '''

@app.route('/')
def index():
    return render_template_string('''
<!DOCTYPE html>
<html>
<head>
    <title>SecureCorp Apex Bank</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #0f172a; color: #f8fafc; }
        .card { background: #1e293b; padding: 25px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 25px; }
        h1 { color: #38bdf8; }
        .balance { font-size: 2.5em; font-weight: bold; color: #10b981; }
        input[type="number"], input[type="text"] { padding: 12px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #f8fafc; width: 100%; margin-top: 5px; box-sizing: border-box; }
        input[type="submit"], button { padding: 12px 25px; border-radius: 6px; border: none; background: #38bdf8; color: #0f172a; font-weight: bold; cursor: pointer; margin-top: 15px; width: 100%; }
        button.reset { background: #ef4444; color: white; margin-top: 10px; }
        .logs { background: #090d16; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 0.85em; max-height: 200px; overflow-y: auto; color: #a7f3d0; border-left: 4px solid #10b981; }
        .hint { color: #94a3b8; font-size: 0.9em; margin-top: 15px; }
        .alert { padding: 12px; border-radius: 6px; background: #f43f5e20; border: 1px solid #f43f5e; color: #fda4af; margin-top: 15px; }
    </style>
</head>
<body>
    {{ banner | safe }}
    <h1>SecureCorp Apex Bank</h1>
    <p>Welcome to the premium digital transaction gateway. Exploit race conditions to bypass validation logic.</p>
    
    <div class="card">
        <h3>Account Balance</h3>
        <div class="balance">${{ balance }}</div>
        <p class="hint">Goal: Overdraft your account to less than -$100 to trigger the banking engine fail-safe flag release!</p>
    </div>

    <div class="card">
        <h3>Direct Wire Transfer</h3>
        <form id="transfer-form">
            <label>Recipient Account Route</label>
            <input type="text" name="recipient" value="AC-994821" readonly>
            <label style="margin-top: 15px; display: block;">Amount to Wire</label>
            <input type="number" name="amount" id="amount" value="80" min="1" max="100">
            <button type="button" onclick="performRace()">Perform Flash Transfer</button>
        </form>
        <button class="reset" onclick="resetAccount()">Reset Balance</button>
    </div>

    <div class="card">
        <h3>🔍 Real-Time System Log (Insecure Logging)</h3>
        <div class="logs" id="sys-logs">
            [SYS_LOG] System initialized. Account loaded with starting balance of $100.<br>
            [SECURITY_WARN] Transaction routing bypassing safe mutex thread gates...
        </div>
    </div>

    {% if flag_issued %}
    <div class="card" style="border: 2px solid #ef4444; background: #ef444415;">
        <h3 style="color: #f87171;">Flag Captured!</h3>
        <p>You successfully overdrafted the banking ledger engine using thread concurrence race conditions!</p>
        <code style="font-size: 1.2em; color: #fff; font-weight: bold; background: #ef4444; padding: 6px 12px; border-radius: 4px; display: inline-block;">flag{fintech_race_condition_overdraft_success_200}</code>
    </div>
    {% endif %}

    {% if is_secure_mode %}
    <div class="card" style="border: 2px solid #10b981; background: #10b98115;">
        <h3 style="color: #34d399;">Secure Verification Flag</h3>
        <p>Excellent! Safe mutex locking protects transactions against double-spending or race condition exploits.</p>
        <code style="font-size: 1.2em; color: #fff; font-weight: bold; background: #10b981; padding: 6px 12px; border-radius: 4px; display: inline-block;">flag{fintech_secure_mutex_concurrency_200}</code>
    </div>
    {% endif %}

    <script>
        async function performRace() {
            const amount = document.getElementById('amount').value;
            const logBox = document.getElementById('sys-logs');
            
            logBox.innerHTML += `<br>[TX_PENDING] Initiating rapid thread batch wire of $${amount}...`;
            
            // To successfully trigger a race condition, the client needs to fire concurrent requests
            // We will help them trigger 3 concurrent transfers at once inside their browser!
            const reqs = [
                fetch('/transfer?amount=' + amount, { method: 'POST' }),
                fetch('/transfer?amount=' + amount, { method: 'POST' }),
                fetch('/transfer?amount=' + amount, { method: 'POST' })
            ];
            
            try {
                const responses = await Promise.all(reqs);
                const results = await Promise.all(responses.map(r => r.json()));
                
                results.forEach(res => {
                    logBox.innerHTML += `<br>[TX_RESULT] Status: ${res.status} | Balance: $${res.balance} | Logged credentials: PIN_HASH=${res.insecure_log.auth_pin_hash} TOKEN=${res.insecure_log.session_token}`;
                });
                
                setTimeout(() => window.location.reload(), 2000);
            } catch (err) {
                logBox.innerHTML += `<br>[TX_ERROR] Connection failure: ${err}`;
            }
        }

        async function resetAccount() {
            await fetch('/reset', { method: 'POST' });
            window.location.reload();
        }
    </script>
</body>
</html>
    ''', balance=db['balance'], flag_issued=db['flag_issued'], banner=get_banner(), is_secure_mode=session.get('secure', False))

@app.route('/transfer', methods=['POST'])
def transfer():
    amount = int(request.args.get('amount', 0))
    
    insecure_log = {
        "user_routing": "AC-112004-MASTER",
        "auth_pin_hash": "e6b7d8c9012ff84196",
        "tx_amount": amount,
        "session_token": "bearer_admin_fixed_session_token_xyz"
    }

    if session.get('secure', False):
        # SECURE: Safe atomic locking
        with db_lock:
            current_balance = db['balance']
            time.sleep(0.4)
            if current_balance >= amount:
                new_balance = current_balance - amount
                db['balance'] = new_balance
                if db['balance'] < -100:
                    db['flag_issued'] = True
                return jsonify({
                    "status": "success",
                    "balance": db['balance'],
                    "insecure_log": insecure_log
                })
            else:
                return jsonify({
                    "status": "rejected",
                    "reason": "Insufficient balance",
                    "balance": db['balance'],
                    "insecure_log": insecure_log
                }), 400
    else:
        # VULNERABLE: Direct read-sleep-write race condition
        current_balance = db['balance']
        time.sleep(0.4)
        if current_balance >= amount:
            new_balance = current_balance - amount
            db['balance'] = new_balance
            if db['balance'] < -100:
                db['flag_issued'] = True
            return jsonify({
                "status": "success",
                "balance": db['balance'],
                "insecure_log": insecure_log
            })
        else:
            return jsonify({
                "status": "rejected",
                "reason": "Insufficient balance",
                "balance": db['balance'],
                "insecure_log": insecure_log
            }), 400

@app.route('/reset', methods=['POST'])
def reset():
    db['balance'] = 100
    db['flag_issued'] = False
    return jsonify({"status": "reset", "balance": 100})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)

