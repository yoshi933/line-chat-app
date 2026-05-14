/**
 * LINE風チャットアプリ - スプレッドシート操作モジュール
 */

const DatabaseModule = {
  /**
   * スプレッドシートインスタンスを取得
   * @returns {Spreadsheet} スプレッドシート
   */
  getSpreadsheet: function() {
    return SpreadsheetApp.getActiveSpreadsheet();
  },

  /**
   * 指定したシートを取得
   * @param {string} sheetName - シート名
   * @returns {Sheet} シート
   */
  getSheet: function(sheetName) {
    return this.getSpreadsheet().getSheetByName(sheetName);
  },

  /**
   * シートに行を追加
   * @param {string} sheetName - シート名
   * @param {Array} values - 追加する値の配列
   * @returns {Range} 追加された行のRange
   */
  appendRow: function(sheetName, values) {
    const sheet = this.getSheet(sheetName);
    return sheet.appendRow(values);
  },

  /**
   * シートのすべての行を取得
   * @param {string} sheetName - シート名
   * @returns {Array} 2次元配列（ヘッダー含む）
   */
  getAllRows: function(sheetName) {
    const sheet = this.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    return data;
  },

  /**
   * 指定した列の値で検索
   * @param {string} sheetName - シート名
   * @param {number} columnIndex - 列インデックス（0からスタート）
   * @param {*} value - 検索値
   * @returns {Array|null} マッチした行のデータ（ヘッダー含む）
   */
  getRowByColumn: function(sheetName, columnIndex, value) {
    const data = this.getAllRows(sheetName);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][columnIndex] === value) {
        return data[i];
      }
    }
    return null;
  },

  /**
   * 指定した列の値で行インデックスを検索
   * @param {string} sheetName - シート名
   * @param {number} columnIndex - 列インデックス（0からスタート）
   * @param {*} value - 検索値
   * @returns {number|null} マッチした行インデックス（ヘッダー含む）
   */
  getRowIndexByColumn: function(sheetName, columnIndex, value) {
    const data = this.getAllRows(sheetName);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][columnIndex] === value) {
        return i + 1;
      }
    }
    return null;
  },

  /**
   * 指定した行を更新
   * @param {string} sheetName - シート名
   * @param {number} rowIndex - 行インデックス（1からスタート）
   * @param {Array} values - 更新する値の配列
   */
  updateRow: function(sheetName, rowIndex, values) {
    const sheet = this.getSheet(sheetName);
    const range = sheet.getRange(rowIndex, 1, 1, values.length);
    range.setValues([values]);
  },

  /**
   * 指定した行のセルを更新
   * @param {string} sheetName - シート名
   * @param {number} rowIndex - 行インデックス（1からスタート）
   * @param {number} columnIndex - 列インデックス（1からスタート）
   * @param {*} value - 更新する値
   */
  updateCell: function(sheetName, rowIndex, columnIndex, value) {
    const sheet = this.getSheet(sheetName);
    sheet.getRange(rowIndex, columnIndex).setValue(value);
  },

  /**
   * 指定した行を削除
   * @param {string} sheetName - シート名
   * @param {number} rowIndex - 行インデックス（1からスタート）
   */
  deleteRow: function(sheetName, rowIndex) {
    const sheet = this.getSheet(sheetName);
    sheet.deleteRow(rowIndex);
  },

  /**
   * メールアドレスでユーザーを検索
   * @param {string} email - メールアドレス
   * @returns {Object|null} ユーザーオブジェクト
   */
  getUserByEmail: function(email) {
    const row = this.getRowByColumn('Users', 1, email); // 列B（インデックス1）
    
    if (row) {
      return {
        userId: row[0],
        email: row[1],
        username: row[2],
        createdAt: row[3],
        lastLogin: row[4]
      };
    }
    return null;
  },

  /**
   * ユーザーIDでユーザーを検索
   * @param {string} userId - ユーザーID
   * @returns {Object|null} ユーザーオブジェクト
   */
  getUserById: function(userId) {
    const row = this.getRowByColumn('Users', 0, userId); // 列A（インデックス0）
    
    if (row) {
      return {
        userId: row[0],
        email: row[1],
        username: row[2],
        createdAt: row[3],
        lastLogin: row[4]
      };
    }
    return null;
  },

  /**
   * すべてのユーザーを取得
   * @returns {Array} ユーザーオブジェクトの配列
   */
  getAllUsers: function() {
    const data = this.getAllRows('Users');
    const users = [];
    
    for (let i = 1; i < data.length; i++) {
      users.push({
        userId: data[i][0],
        email: data[i][1],
        username: data[i][2],
        createdAt: data[i][3],
        lastLogin: data[i][4]
      });
    }
    return users;
  },

  /**
   * メッセージを追加
   * @param {string} senderId - 送信者ID
   * @param {string} recipientId - 受信者ID
   * @param {string} message - メッセージ本文
   * @returns {Object} メッセージオブジェクト
   */
  addMessage: function(senderId, recipientId, message) {
    const msgId = this.generateMessageId();
    const timestamp = new Date().toISOString();
    
    this.appendRow('Messages', [msgId, senderId, recipientId, message, timestamp, false]);
    
    return {
      msgId: msgId,
      senderId: senderId,
      recipientId: recipientId,
      message: message,
      timestamp: timestamp,
      isRead: false
    };
  },

  /**
   * メッセージIDを生成（msg_xxxxxxxx形式）
   * @returns {string} 生成されたメッセージID
   */
  generateMessageId: function() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return 'msg_' + timestamp + '_' + random;
  },

  /**
   * ユーザーIDのメッセージを取得
   * @param {string} userId - ユーザーID
   * @param {number} limit - 取得する最大件数
   * @returns {Array} メッセージオブジェクトの配列
   */
  getMessagesByUserId: function(userId, limit) {
    const data = this.getAllRows('Messages');
    const messages = [];
    
    for (let i = Math.max(1, data.length - limit); i < data.length; i++) {
      const row = data[i];
      // 送信者または受信者が自分のメッセージを取得
      if (row[1] === userId || row[2] === userId) {
        messages.push({
          msgId: row[0],
          senderId: row[1],
          recipientId: row[2],
          message: row[3],
          timestamp: row[4],
          isRead: row[5]
        });
      }
    }
    return messages;
  },

  /**
   * 2人のユーザー間の会話を取得
   * @param {string} userId1 - ユーザーID1
   * @param {string} userId2 - ユーザーID2
   * @returns {Array} メッセージオブジェクトの配列
   */
  getConversation: function(userId1, userId2) {
    const data = this.getAllRows('Messages');
    const messages = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const isBetweenUsers = (row[1] === userId1 && row[2] === userId2) ||
                             (row[1] === userId2 && row[2] === userId1);
      
      if (isBetweenUsers) {
        messages.push({
          msgId: row[0],
          senderId: row[1],
          recipientId: row[2],
          message: row[3],
          timestamp: row[4],
          isRead: row[5]
        });
      }
    }
    return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  /**
   * メッセージを削除
   * @param {string} msgId - メッセージID
   * @returns {boolean} 削除成功したかどうか
   */
  deleteMessage: function(msgId) {
    const rowIndex = this.getRowIndexByColumn('Messages', 0, msgId);
    
    if (rowIndex) {
      this.deleteRow('Messages', rowIndex);
      return true;
    }
    return false;
  },

  /**
   * メッセージを既読にする
   * @param {string} msgId - メッセージID
   * @returns {boolean} 成功したかどうか
   */
  markMessageAsRead: function(msgId) {
    const rowIndex = this.getRowIndexByColumn('Messages', 0, msgId);
    
    if (rowIndex) {
      this.updateCell('Messages', rowIndex, 6, true); // 列F（インデックス5）
      return true;
    }
    return false;
  },

  /**
   * 設定値を取得
   * @param {string} key - キー
   * @returns {string|null} 値
   */
  getSetting: function(key) {
    const row = this.getRowByColumn('Settings', 0, key);
    return row ? row[1] : null;
  },

  /**
   * 設定値を設定
   * @param {string} key - キー
   * @param {string} value - 値
   */
  setSetting: function(key, value) {
    const rowIndex = this.getRowIndexByColumn('Settings', 0, key);
    
    if (rowIndex) {
      this.updateCell('Settings', rowIndex, 2, value);
    } else {
      this.appendRow('Settings', [key, value]);
    }
  }
};
