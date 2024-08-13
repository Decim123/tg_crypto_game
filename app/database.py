import sqlite3

def get_db_connection():
    conn = sqlite3.connect('database.db')
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
            locked_skins TEXT DEFAULT '2,3,4,5,6,7,8,9'
        )
    ''')
    conn.commit()
    conn.close()

create_users_table()

def add_user_if_not_exists(tg_id, username):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        tg_id = int(tg_id)
    except ValueError:
        print("Invalid tg_id: must be an integer")
        return

    cursor.execute('SELECT * FROM users WHERE tg_id = ?', (tg_id,))
    user = cursor.fetchone()

    if user is None:
        cursor.execute('''
            INSERT INTO users (tg_id, username)
            VALUES (?, ?)
        ''', (tg_id, username))
        conn.commit()

    conn.close()
