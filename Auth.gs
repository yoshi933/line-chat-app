/**
 * LINE風チャットアプリ - 認証・ユーザー管理モジュール
 */

const AuthModule = {
  /**
   * 現在のGoogleアカウントのメールアドレスを取得
   * @returns {string} メールアドレス
   */
  getCurrentUserEmail: function() {
    return Session.getActiveUser().getEmail();
  },

  /**
   * 現在のユーザー情報を取得（登録済みの場合）
   * @returns {Object} ユーザー情報 { email, userId, username, createdAt, lastLogin }
   */
  getCurrentUser: function() {
    try {
      const email = this.getCurrentUserEmail();
      const user = DatabaseModule.getUserByEmail(email);
      
      if (user) {
        // LastLoginを更新
        this.updateLastLogin(user.userId);
        return { success: true, user: user };
      } else {
        return { success: false, user: null, message: 'User not registered' };
      }
    } catch (error) {
      Logger.log('getCurrentUser Error: ' + error.toString());
      return { success: false, error: error.toString() };
    }
  },

  /**
   * ユーザーが既に登録されているか確認
   * @returns {Object} { exists: boolean, user: Object|null }
   */
  checkUserExists: function() {
    try {
      const email = this.getCurrentUserEmail();
      const user = DatabaseModule.getUserByEmail(email);
      
      return {
        success: true,
        exists: user !== null,
        user: user || null
      };
    } catch (error) {
      Logger.log('checkUserExists Error: ' + error.toString());
      return { success: false, error: error.toString() };
    }
  },

  /**
   * 新規ユーザーを登録
   * @param {string} username - ユーザー名
   * @returns {Object} { success: boolean, userId: string, error?: string }
   */
  registerUser: function(username) {
    try {
      const email = this.getCurrentUserEmail();
      
      // 既に登録されていないか確認
      const existingUser = DatabaseModule.getUserByEmail(email);
      if (existingUser) {
        return { 
          success: false, 
          error: 'User already registered',
          user: existingUser 
        };
      }

      // ユーザーIDを生成
      const userId = this.generateUserId();
      const now = new Date().toISOString();

      // UsersシートにUserIDを追加
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
      sheet.appendRow([userId, email, username, now, now]);

      Logger.log('User registered: ' + userId + ' (' + email + ')');

      return {
        success: true,
        userId: userId,
        email: email,
        username: username,
        createdAt: now
      };
    } catch (error) {
      Logger.log('registerUser Error: ' + error.toString());
      return { success: false, error: error.toString() };
    }
  },

  /**
   * ユーザーIDを生成（user_xxxxxxxx形式）
   * @returns {string} 生成されたユーザーID
   */
  generateUserId: function() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return 'user_' + timestamp + '_' + random;
  },

  /**
   * メールアドレスでユーザーを検索
   * @param {string} email - メールアドレス
   * @returns {Object|null} ユーザーオブジェクト
   */
  getUserByEmail: function(email) {
    return DatabaseModule.getUserByEmail(email);
  },

  /**
   * ユーザーIDでユーザーを検索
   * @param {string} userId - ユーザーID
   * @returns {Object|null} ユーザーオブジェクト
   */
  getUserById: function(userId) {
    return DatabaseModule.getUserById(userId);
  },

  /**
   * LastLoginを更新
   * @param {string} userId - ユーザーID
   * @returns {boolean} 成功したかどうか
   */
  updateLastLogin: function(userId) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === userId) {
          const now = new Date().toISOString();
          sheet.getRange(i + 1, 5).setValue(now);
          return true;
        }
      }
      return false;
    } catch (error) {
      Logger.log('updateLastLogin Error: ' + error.toString());
      return false;
    }
  },

  /**
   * ユーザー名の妥当性を検証
   * @param {string} username - ユーザー名
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateUsername: function(username) {
    if (!username || username.trim().length === 0) {
      return { valid: false, error: 'Username cannot be empty' };
    }
    if (username.length > 50) {
      return { valid: false, error: 'Username must be less than 50 characters' };
    }
    if (!/^[a-zA-Z0-9_\-\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+$/.test(username)) {
      return { valid: false, error: 'Username contains invalid characters' };
    }
    return { valid: true };
  }
};
