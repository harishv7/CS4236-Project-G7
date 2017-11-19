#!/usr/bin/env python3
"""
Script to simulate user input.
MSS
=====
1. Player 2 Activate Game
2. Player 2, 3, 4 join Game
3. Player 2, 3, 4 do game register:
    Format: playerId -> secret, guess, r1, r2, bid_value
    2 -> 0, 1, 123, 123, 10
    3 -> 0, 1, 234, 234, 20
    4 -> 1, 0, 345, 345, 10
3. Player 2, 3, 4 reveal secrets:
    2 -> 0, 1, 123, 123
    3 -> 0, 1, 234, 234
    4 -> 1, 0, 345, 345

Expected output:
Winning cup: 1
Winners: [{player_id: 2, win_value: 3.33}, {playerId: 3, win_value: 6.67}]
"""
import requests
import time
from Crypto.Hash import SHA256

clock_duration = 20
send_transaction_url = 'http://localhost:3000/send-transaction'

bets = {
    2: {'secret': '0', 'guess': '1', 'r_one': '123', 'r_two': '123', 'bid_value': 10},
    3: {'secret': '0', 'guess': '1', 'r_one': '234', 'r_two': '234', 'bid_value': 20},  # change secret to 1 for no winner case
    4: {'secret': '1', 'guess': '0', 'r_one': '345', 'r_two': '345', 'bid_value': 10}
}

def main():

    # 1. Activate game
    requests.post(send_transaction_url, data={
        'transaction_id': 0,
        'player_id': 2,
        'min_bid_value': 10
    })

    # 2. Join Game
    game_id = int(input('Enter the game id (only after the game has been activated): '))
    for key in bets.keys():
        requests.post(send_transaction_url, data={
            'transaction_id': 1,
            'player_id': key,
            'game_id': game_id
        })

    # 3. Game register
    time.sleep(3 * clock_duration + 3)  # from sending JOIN_GAME to sending GAME_REGISTER is 3 clock_duration away
    for key, val in bets.items():
        hash1, hash2 = SHA256.new(), SHA256.new()
        hash1.update(bytes(val['r_one'] + val['secret'], 'utf-8'))
        hash2.update(bytes(val['r_two'] + val['guess'], 'utf-8'))
        
        requests.post(send_transaction_url, data={
            'transaction_id': 4,
            'player_id': key,
            'game_id': game_id,
            'commit_secret': hash1.digest().hex(),
            'commit_guess': hash2.digest().hex(),
            'bid_value': val['bid_value']
        })

    # 4. Reveal secret
    time.sleep(clock_duration + 1)
    for key, val in bets.items():
        # Simulate a dishonest player
        # if key == 4:
        #     continue
        requests.post(send_transaction_url, data={
            'transaction_id': 5,
            'player_id': key,
            'game_id': game_id,
            'secret': val['secret'],
            'guess': val['guess'],
            'r_one': val['r_one'],
            'r_two': val['r_two']
        })

if __name__ == '__main__':
    main()
