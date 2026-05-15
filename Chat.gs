/**
 * LINE風チャットアプリ - チャット機能モジュール
 */

const ChatModule = {
  /**
   * メッセージを送信
   * @param {string} recipientId - 受信者ID
   * @param {string} messageText - メッセージ本文
   * @returns {Object} { success: boolean, message?: Object, error?: string }
   */
  sendMessage: function(recipientId, messageText) {
    try {
      // 送信者の情報を取得
      const senderEmail = Session.getActiveUser().getEmail();
      const sender = DatabaseModule.getUserByEmail(senderEmail);

      if (!sender) {
        return { success: false, error: 'Sender not registered' };
      }

      // メッセージ本文の検証
      if (!messageText || messageText.trim().length === 0) {
        return { success: false, error: 'Message cannot be empty' };
      }

      if (messageText.length > 10000) {
        return { success: false, error: 'Message is too long (max 10000 characters)' };
      }

      // 受信者が存在するか確認
      const recipient = DatabaseModule.getUserById(recipientId);
      if (!recipient) {
        return { success: false, error: 'Recipient not found' };
      }

      // メッセージを追加
      const message = DatabaseModule.addMessage(
        sender.userId,
        recipientId,
        messageText.trim()
      );

      Logger.log('Message sent: ' + message.msgId);

      return {
        success: true,
        message: message
      };
    } catch (error) {
      Logger.log('sendMessage Error: ' + error.toString());
      return { success: false, error: error.toString() };
    }
  },

  /**
   * ユーザーのメッセージを取得
   * @param {string} userId - ユーザーID（会話相手のID）
   * @param {number} limit - 取得する最大件数
   * @returns {Object} { success: boolean, messages?: Array, error?: string }
   */
  getMessages: function(userId, limit) {
    try {
      const currentUserEmail = Session.getActiveUser().getEmail();
      const currentUser = DatabaseModule.getUserByEmail(currentUserEmail);

      if (!currentUser) {
        return { success: false, error: 'Current user not registered' };
      }

      // userId と currentUser の間の会話を取得
      const messages = DatabaseModule.getConversation(currentUser.userId, userId);

      // limit件に制限
      const limitedMessages = messages.slice(Math.max(0, messages.length - limit));

      return {
        success: true,
        messages: limitedMessages
      };
    } catch (error) {
      Logger.log('getMessages Error: ' + error.toString());
      return { success: false, error: error.toString() };
    }
  },

  /**
   * すべてのユーザーを取得（自分を除く）
   * @returns {Object} { success: boolean, users?: Array, error?: string }
   */
  getAllUsers: function() {
    try {
      const currentUserEmail = Session.getActiveUser().getEmail();
      const currentUser = DatabaseModule.getUserByEmail(currentUserEmail);

      if (!currentUser) {
        return { success: false, error: 'Current user not registered' };
      }

      const allUsers = DatabaseModule.getAllUsers();

      // 自分を除外
      const otherUsers = allUsers.filter(user => user.userId !== currentUser.userId);

      return {
        success: true,
        users: otherUsers
      };
    } catch (error) {
      Logger.log('getAllUsers Error: ' + error.toString());
      return { success: false, error: error.toString() };
    }
  },

  /**
   * メッセージを既読にする
   * @param {string} messageId - メッセージID
   * @returns {Object} { success: boolean, error?: string }
   */
  markAsRead: function(messageId) {
    try {
      const success = DatabaseModule.markMessageAsRead(messageId);

      if (!success) {
        return { success: false, error: 'Message not found' };
      }

      Logger.log('Message marked as read: ' + messageId);

      return { success: true };
    } catch (error) {
      Logger.log('markAsRead Error: ' + error.toString());
      return { success: false, error: error.toString() };
    }
  },

  /**
   * メッセージを削除
   * @param {string} messageId - メッセージID
   * @returns {Object} { success: boolean, error?: string }
   */
  deleteMessage: function(messageId) {
    try {
      const currentUserEmail = Session.getActiveUser().getEmail();
      const currentUser = DatabaseModule.getUserByEmail(currentUserEmail);

      if (!currentUser) {
        return { success: false, error: 'Current user not registered' };
      }

      // メッセージを取得して、送信者が自分か確認
      const data = DatabaseModule.getAllRows('Messages');
      let messageRowIndex = null;
      let isSender = false;

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === messageId) {
          messageRowIndex = i + 1;
          isSender = (data[i][1] === currentUser.userId);
          break;
        }
      }

      if (!messageRowIndex) {
        return { success: false, error: 'Message not found' };
      }

      if (!isSender) {
        return { success: false, error: 'You can only delete your own messages' };
      }

      // メッセージを削除
      DatabaseModule.deleteMessage(messageId);

      Logger.log('Message deleted: ' + messageId);

      return { success: true };
    } catch (error) {
      Logger.log('deleteMessage Error: ' + error.toString());
      return { success: false, error: error.toString() };
    }
  },

  /**
   * ユーザーの会話一覧を取得
   * @param {string} userId - ユーザーID
   * @returns {Object} { success: boolean, conversations?: Array, error?: string }
   */
  getConversations: function(userId) {
    try {
      const currentUserEmail = Session.getActiveUser().getEmail();
      const currentUser = DatabaseModule.getUserByEmail(currentUserEmail);

      if (!currentUser) {
        return { success: false, error: 'Current user not registered' };
      }

      // 現在のユーザーが関連するすべてのメッセージを取得
      const data = DatabaseModule.getAllRows('Messages');
      const conversationMap = {};

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const senderId = row[1];
        const recipientId = row[2];
        const timestamp = row[4];

        // 自分が送受信したメッセージのみを対象
        if (senderId === currentUser.userId) {
          if (!conversationMap[recipientId]) {
            conversationMap[recipientId] = timestamp;
          } else if (new Date(timestamp) > new Date(conversationMap[recipientId])) {
            conversationMap[recipientId] = timestamp;
          }
        } else if (recipientId === currentUser.userId) {
          if (!conversationMap[senderId]) {
            conversationMap[senderId] = timestamp;
          } else if (new Date(timestamp) > new Date(conversationMap[senderId])) {
            conversationMap[senderId] = timestamp;
          }
        }
      }

      // 会話一覧を生成
      const conversations = [];
      for (const partnerId in conversationMap) {
        const partner = DatabaseModule.getUserById(partnerId);
        if (partner) {
          conversations.push({
            userId: partnerId,
            username: partner.username,
            email: partner.email,
            lastMessageTime: conversationMap[partnerId]
          });
        }
      }

      // 最新のメッセージ順でソート
      conversations.sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );

      return {
        success: true,
        conversations: conversations
      };
    } catch (error) {
      Logger.log('getConversations Error: ' + error.toString());
      return { success: false, error: error.toString() };
    }
  },

  /**
   * メールアドレスで登録済みユーザーを検索（新しいトーク開始用）
   * @param {string} email - 検索するメールアドレス
   * @returns {Object} { success: boolean, user?: Object, error?: string }
   */
  findUserByEmail: function(email) {
    try {
      const currentUserEmail = Session.getActiveUser().getEmail();
      const currentUser = DatabaseModule.getUserByEmail(currentUserEmail);

      if (!currentUser) {
        return { success: false, error: 'Current user not registered' };
      }

      if (!email || !email.trim()) {
        return { success: false, error: 'Email is required' };
      }

      const trimmedEmail = email.trim().toLowerCase();

      if (trimmedEmail === currentUserEmail.toLowerCase()) {
        return { success: false, error: 'Cannot start a conversation with yourself' };
      }

      const user = DatabaseModule.getUserByEmail(trimmedEmail);

      if (!user) {
        return { success: false, error: 'No user found with this email address' };
      }

      return { success: true, user: user };
    } catch (error) {
      Logger.log('findUserByEmail Error: ' + error.toString());
      return { success: false, error: error.toString() };
    }
  },

  /**
   * 未読メッセージ数を取得
   * @returns {Object} { success: boolean, unreadCount?: number, error?: string }
   */
  getUnreadMessageCount: function() {
    try {
      const currentUserEmail = Session.getActiveUser().getEmail();
      const currentUser = DatabaseModule.getUserByEmail(currentUserEmail);

      if (!currentUser) {
        return { success: false, error: 'Current user not registered' };
      }

      const data = DatabaseModule.getAllRows('Messages');
      let unreadCount = 0;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // 自分が受信者で、かつ未読のメッセージ
        if (row[2] === currentUser.userId && row[5] === false) {
          unreadCount++;
        }
      }

      return {
        success: true,
        unreadCount: unreadCount
      };
    } catch (error) {
      Logger.log('getUnreadMessageCount Error: ' + error.toString());
      return { success: false, error: error.toString() };
    }
  }
};
