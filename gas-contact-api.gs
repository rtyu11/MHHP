/**
 * Contact Form API for Google Apps Script
 * 
 * 302リダイレクト後にPOSTがGETに変換される問題に対応
 * - doPost: e.postData が無い場合は e.parameter を使用
 * - doGet: handle_contact を通して送信処理を許可
 * - Logger.log で method と data を必ず出力
 */

/**
 * POSTリクエストの処理
 */
function doPost(e) {
  Logger.log('=== doPost called ===');
  
  let data = {};
  let method = 'POST';
  
  // e.postData がある場合はそれを使用（通常のPOST）
  if (e.postData && e.postData.contents) {
    try {
      // URLSearchParams形式（application/x-www-form-urlencoded）をパース
      const contents = e.postData.contents;
      data = parseFormData(contents);
    } catch (error) {
      Logger.log('Error parsing postData.contents: ' + error);
      // パースに失敗した場合は e.parameter を使用
      data = e.parameter || {};
    }
  } else {
    // e.postData が無い場合は e.parameter を使用（リダイレクト後の場合など）
    Logger.log('postData not found, using e.parameter');
    data = e.parameter || {};
    method = 'POST (via parameter)';
  }
  
  Logger.log('method: ' + method);
  Logger.log('data: ' + JSON.stringify(data));
  
  return handle_contact(data);
}

/**
 * GETリクエストの処理（302リダイレクト後など）
 */
function doGet(e) {
  Logger.log('=== doGet called ===');
  
  const method = 'GET';
  const data = e.parameter || {};
  
  Logger.log('method: ' + method);
  Logger.log('data: ' + JSON.stringify(data));
  
  // handle_contact を通して送信処理を許可
  return handle_contact(data);
}

/**
 * 共通の送信処理
 * @param {Object} data - フォームデータ
 * @returns {Object} レスポンス
 */
function handle_contact(data) {
  Logger.log('=== handle_contact called ===');
  Logger.log('Received data: ' + JSON.stringify(data));
  
  try {
    // バリデーション
    if (!data.name || !data.email || !data.message || !data.category) {
      Logger.log('Validation failed: missing required fields');
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: '必須項目が不足しています。'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ハニーポットチェック
    if (data.website && data.website.trim() !== '') {
      Logger.log('Spam detected: website field is not empty');
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: '送信できませんでした。'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // メール送信
    const recipientEmail = 'info@masatohayashi.jp'; // 送信先メールアドレス（必要に応じて変更）
    const subject = '【お問い合わせ】' + getCategoryName(data.category);
    const body = createEmailBody(data);
    
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: body,
      replyTo: data.email
    });
    
    Logger.log('Email sent successfully to: ' + recipientEmail);
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      message: '送信が完了しました。'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in handle_contact: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: '送信に失敗しました。しばらく時間をおいて再度お試しください。'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * カテゴリ名を日本語に変換
 */
function getCategoryName(category) {
  const categoryMap = {
    'work': '仕事依頼',
    'appearance': '出演依頼',
    'inquiry': 'お問い合わせ',
    'other': 'その他'
  };
  return categoryMap[category] || category;
}

/**
 * URLSearchParams形式のデータをパース
 * @param {string} formData - URLSearchParams形式の文字列
 * @returns {Object} パースされたデータ
 */
function parseFormData(formData) {
  const data = {};
  const pairs = formData.split('&');
  
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    if (pair.length === 2) {
      const key = decodeURIComponent(pair[0].replace(/\+/g, ' '));
      const value = decodeURIComponent(pair[1].replace(/\+/g, ' '));
      data[key] = value;
    }
  }
  
  return data;
}

/**
 * メール本文を作成
 */
function createEmailBody(data) {
  const categoryName = getCategoryName(data.category);
  const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString('ja-JP') : new Date().toLocaleString('ja-JP');
  
  return `
お問い合わせフォームから新しいメッセージが届きました。

【お問い合わせ種別】
${categoryName}

【お名前】
${data.name}

【メールアドレス】
${data.email}

【メッセージ】
${data.message}

【送信日時】
${timestamp}
`;
}

