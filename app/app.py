from flask import Flask, request, render_template, url_for, redirect, jsonify
from flask_cors import CORS
import os
import sqlite3

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для всех доменов

def get_db_connection():
    conn = sqlite3.connect('/var/www/tg_crypto_game/database.db')
    conn.row_factory = sqlite3.Row
    return conn

def create_users_table():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            tg_id INTEGER PRIMARY KEY,
            username TEXT,
            coins INTEGER DEFAULT 0,
            coins_week INTEGER DEFAULT 0,
            place INTEGER,
            place_week INTEGER,
            skin INTEGER DEFAULT 1,
            available_skins TEXT DEFAULT '1',
            locked_skins TEXT DEFAULT '2,3,4,5,6,7,8,9,10'
        )
    ''')
    conn.commit()
    conn.close()

def create_wallets_table():
    conn = sqlite3.connect('/var/www/tg_crypto_game/wallets.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS wallets (
            tg_id INTEGER PRIMARY KEY,
            wallet_address TEXT
        )
    ''')
    conn.commit()
    conn.close()

def add_user_if_not_exists(tg_id, username):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE tg_id = ?', (tg_id,))
    user = cursor.fetchone()

    if user is None:
        cursor.execute('''
            INSERT INTO users (tg_id, username)
            VALUES (?, ?)
        ''', (tg_id, username))
        conn.commit()

    conn.close()

def get_user_data(tg_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT username, coins, coins_week, skin FROM users WHERE tg_id = ?', (tg_id,))
    user = cursor.fetchone()
    conn.close()
    return user

def update_user_position(tg_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        UPDATE users
        SET place = (
            SELECT COUNT(*) + 1
            FROM users AS u2
            WHERE u2.coins > users.coins
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    tg_id = request.args.get('tg_id')
    username = request.args.get('username')

    coins = 0
    coins_week = 0
    skin = 1  # Значение по умолчанию

    if tg_id and username:
        try:
            tg_id = int(tg_id)
            add_user_if_not_exists(tg_id, username)
            user_data = get_user_data(tg_id)

            if user_data:
                coins = user_data['coins']
                coins_week = user_data['coins_week']
                skin = user_data['skin'] if 'skin' in user_data.keys() else 1

        except ValueError:
            print("Invalid tg_id: must be an integer")

    return render_template('main.html', tg_id=tg_id, coins=coins, coins_week=coins_week, skin=skin)

@app.route('/game')
def game():
    tg_id = request.args.get('tg_id', 'Неизвестный пользователь')
    user_data = get_user_data(tg_id)
    skin = user_data['skin'] if user_data else 1
    return render_template('game/index.html', tg_id=tg_id, skin=skin)

@app.route('/update_skin', methods=['POST'])
def update_skin():
    tg_id = request.form.get('tg_id')
    skin = int(request.form.get('skin'))

    if tg_id and skin:
        try:
            tg_id = int(tg_id)
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute('''
                UPDATE users 
                SET skin = ?
                WHERE tg_id = ?
            ''', (skin, tg_id))
            conn.commit()
            conn.close()

            return 'Skin updated successfully', 200

        except ValueError:
            return 'Invalid tg_id or skin', 400

    return 'Invalid request', 400

@app.route('/update_score', methods=['POST'])
def update_score():
    tg_id = request.form.get('tg_id')
    score = int(request.form.get('score'))

    if tg_id and score:
        try:
            tg_id = int(tg_id)
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute('''
                UPDATE users 
                SET coins = coins + ?, 
                    coins_week = coins_week + ?
                WHERE tg_id = ?
            ''', (score, score, tg_id))
            conn.commit()
            conn.close()
            
            return 'Score updated successfully', 200

        except ValueError:
            return 'Invalid tg_id', 400

    return 'Invalid request', 400

@app.route('/leaderboard')
def leaderboard():
    tg_id = request.args.get('tg_id')

    if not tg_id:
        return "tg_id not provided", 400

    print(f"Received tg_id: {tg_id}")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT tg_id, username, coins, skin 
        FROM users 
        ORDER BY coins DESC
    ''')
    leaderboard = cursor.fetchall()

    print(f"Leaderboard data: {leaderboard}")

    user_position = None
    user_data = None
    for index, user in enumerate(leaderboard):
        if user['tg_id'] == int(tg_id):
            user_position = index + 1
            user_data = user
            break

    print(f"User data: {user_data}, User position: {user_position}")

    conn.close()

    if user_position is None or user_data is None:
        return "User not found in leaderboard", 404

    return render_template('leaderboard.html', 
                           leaderboard=leaderboard, 
                           username=user_data['username'], 
                           coins=user_data['coins'], 
                           skin=user_data['skin'], 
                           user_position=user_position,
                           tg_id=tg_id)

@app.route('/weakly_leaderboard')
def weakly_leaderboard():
    tg_id = request.args.get('tg_id')

    if not tg_id:
        return "tg_id not provided", 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT tg_id, username, coins_week as coins, skin 
        FROM users 
        ORDER BY coins_week DESC
    ''')
    leaderboard = cursor.fetchall()

    user_position = None
    for index, user in enumerate(leaderboard):
        if user['tg_id'] == int(tg_id):
            user_position = index + 1
            break

    if user_position is None:
        return "User not found in leaderboard", 404

    user_data = get_user_data(tg_id)

    if not user_data:
        return "User data not found", 404

    conn.close()

    return render_template('weakly_leaderboard.html', 
                           leaderboard=leaderboard, 
                           username=user_data['username'], 
                           coins=user_data['coins_week'], 
                           skin=user_data['skin'], 
                           user_position=user_position,
                           tg_id=tg_id)

@app.route('/wallet', methods=['POST'])
def wallet():
    data = request.json
    tg_id = data['tg_id']
    wallet_address = data['account']['address']
    
    conn = sqlite3.connect('/var/www/tg_crypto_game/wallets.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM wallets WHERE tg_id = ?', (tg_id,))
    existing_user = cursor.fetchone()

    if existing_user:
        cursor.execute('UPDATE wallets SET wallet_address = ? WHERE tg_id = ?', (wallet_address, tg_id))
    else:
        cursor.execute('INSERT INTO wallets (tg_id, wallet_address) VALUES (?, ?)', (tg_id, wallet_address))
    
    conn.commit()
    conn.close()

    return jsonify({'status': 'success'})

if __name__ == '__main__':
    create_users_table()
    create_wallets_table()
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
