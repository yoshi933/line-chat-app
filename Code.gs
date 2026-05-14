/**
 * LINE風チャットアプリ - メインエントリーポイント
 * Googleスプレッドシート + Apps Script
 */

// グローバル設定
const CONFIG = {
  SPREADSHEET_ID: null, // 自動取得される
};

/**
 * Webアプリの初回起動時に実行
 * @returns {HtmlOutput} HTMLファイルを返す
 */
function doGet(e) {
  try {
    // スプレッドシートIDを初期化
    CONFIG.SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
    
    // 必要なシートを初期化
    initializeSpreadsheet();
    
    // UI.htmlを返す
    return HtmlService.createHtmlOutputFromFile('UI')
      .setWidth(400)
      .setHeight(600)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    return HtmlService.createHtmlOutput('<p>エラーが発生しました: ' + error.toString() + '</p>');
  }
}

/**
 * リクエストのルーティング処理
 * @param {string} action - 実行するアクション
 * @param {Object} data - アクションに渡すデータ
 * @returns {Object} 処理結果
 */
function handleRequest(action, data) {
  try {
    switch (action) {
      // Auth関連
      case 'getCurrentUser':
        return AuthModule.getCurrentUser();
      
      case 'registerUser':
        return AuthModule.registerUser(data.username);
      
      case 'checkUserExists':
        return AuthModule.checkUserExists();
      
      // Chat関連
      case 'sendMessage':
        return ChatModule.sendMessage(data.recipientId, data.message);
      
      case 'getMessages':
        return ChatModule.getMessages(data.userId, data.limit || 50);
      
      case 'getAllUsers':
        return ChatModule.getAllUsers();
      
      case 'markAsRead':
        return ChatModule.markAsRead(data.messageId);
      
      case 'deleteMessage':
        return ChatModule.deleteMessage(data.messageId);
      
      case 'getConversations':
        return ChatModule.getConversations(data.userId);
      
      default:
        return { success: false, error: 'Unknown action: ' + action };
    }
  } catch (error) {
    Logger.log('handleRequest Error: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * スプレッドシートの初期化
 */
function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 必要なシートを作成
  const sheetNames = ['Users', 'Messages', 'Settings'];
  
  sheetNames.forEach(name => {
    if (!ss.getSheetByName(name)) {
      const sheet = ss.insertSheet(name);
      
      if (name === 'Users') {
        sheet.appendRow(['UserID', 'Email', 'UserName', 'CreatedAt', 'LastLogin']);
      } else if (name === 'Messages') {
        sheet.appendRow(['MsgID', 'SenderId', 'RecipientId', 'Message', 'Timestamp', 'IsRead']);
      } else if (name === 'Settings') {
        sheet.appendRow(['Key', 'Value']);
        sheet.appendRow(['SpreadsheetId', CONFIG.SPREADSHEET_ID]);
        sheet.appendRow(['AppScriptVersion', '1.0']);
      }
    }
  });
}

/**
 * デバッグ用: 現在のユーザー情報を取得
 */
function debugCurrentUser() {
  const email = Session.getActiveUser().getEmail();
  Logger.log('Current User Email: ' + email);
  Logger.log('User ID: ' + Session.getActiveUser().getUserId());
}
