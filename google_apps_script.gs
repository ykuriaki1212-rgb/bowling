// ==================== 設定 ====================
const SPREADSHEET_ID = 'ここにスプレッドシートIDを貼り付け'; // 要変更

// ==================== メイン関数 ====================

/**
 * GETリクエスト処理（データ読み込み）
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'load') {
      const data = loadData();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: data
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: '不明なアクション'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POSTリクエスト処理（データ保存）
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    if (action === 'save') {
      saveData(requestData.data);
      addLog('保存', `スコア${requestData.data.scores.length}件, 動画${requestData.data.videos.length}件`);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'データを保存しました'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: '不明なアクション'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== データ操作 ====================

/**
 * データ読み込み
 */
function loadData() {
  const sheet = getOrCreateDataSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    // データが存在しない場合は初期値を返す
    return {
      scores: [],
      goal: 150,
      videos: []
    };
  }
  
  // 最新行のデータを取得
  const range = sheet.getRange(lastRow, 1, 1, 4);
  const values = range.getValues()[0];
  
  const data = {
    scores: values[0] ? JSON.parse(values[0]) : [],
    goal: values[1] || 150,
    videos: values[2] ? JSON.parse(values[2]) : []
  };
  
  addLog('読み込み', `スコア${data.scores.length}件取得`);
  return data;
}

/**
 * データ保存
 */
function saveData(data) {
  const sheet = getOrCreateDataSheet();
  const timestamp = new Date();
  
  // 新しい行を追加
  const newRow = [
    JSON.stringify(data.scores || []),
    data.goal || 150,
    JSON.stringify(data.videos || []),
    timestamp
  ];
  
  sheet.appendRow(newRow);
  
  // 古いデータ行を削除（最新50件のみ保持）
  const lastRow = sheet.getLastRow();
  if (lastRow > 51) { // ヘッダー + 50行
    sheet.deleteRows(2, lastRow - 51);
  }
}

// ==================== シート管理 ====================

/**
 * データシート取得または作成
 */
function getOrCreateDataSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('スコアデータ');
  
  if (!sheet) {
    sheet = ss.insertSheet('スコアデータ');
    
    // ヘッダー設定
    const headers = ['スコア（JSON）', '目標', '動画（JSON）', '最終更新'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // ヘッダーのスタイル設定
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#e74c3c');
    headerRange.setFontColor('#ffffff');
    
    // 列幅調整
    sheet.setColumnWidth(1, 400);
    sheet.setColumnWidth(2, 80);
    sheet.setColumnWidth(3, 400);
    sheet.setColumnWidth(4, 180);
    
    // シート保護（ヘッダー行のみ）
    const protection = sheet.getRange(1, 1, 1, headers.length).protect();
    protection.setWarningOnly(true);
  }
  
  return sheet;
}

/**
 * ログシート取得または作成
 */
function getOrCreateLogSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('更新ログ');
  
  if (!sheet) {
    sheet = ss.insertSheet('更新ログ');
    
    // ヘッダー設定
    const headers = ['タイムスタンプ', '操作', 'ユーザー', '詳細'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // ヘッダーのスタイル設定
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#3498db');
    headerRange.setFontColor('#ffffff');
    
    // 列幅調整
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 200);
    sheet.setColumnWidth(4, 300);
  }
  
  return sheet;
}

// ==================== ログ管理 ====================

/**
 * ログ追加
 */
function addLog(operation, detail) {
  try {
    const sheet = getOrCreateLogSheet();
    const timestamp = new Date();
    const user = Session.getActiveUser().getEmail() || '不明';
    
    const newRow = [timestamp, operation, user, detail];
    sheet.appendRow(newRow);
    
    // 古いログを削除（最新100件のみ保持）
    const lastRow = sheet.getLastRow();
    if (lastRow > 101) { // ヘッダー + 100行
      sheet.deleteRows(2, lastRow - 101);
    }
  } catch (error) {
    console.error('ログ追加エラー:', error);
  }
}

// ==================== テスト・初期化 ====================

/**
 * 初期化テスト関数
 * スクリプトエディタで最初に実行してください
 */
function testInit() {
  try {
    Logger.log('初期化テスト開始...');
    
    // スプレッドシートIDの確認
    if (SPREADSHEET_ID === 'ここにスプレッドシートIDを貼り付け') {
      throw new Error('SPREADSHEET_IDが設定されていません。コード内のSPREADSHEET_IDを実際のIDに変更してください。');
    }
    
    // スプレッドシートにアクセス
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✓ スプレッドシートへのアクセス成功: ' + ss.getName());
    
    // データシート作成
    const dataSheet = getOrCreateDataSheet();
    Logger.log('✓ データシート作成成功: ' + dataSheet.getName());
    
    // ログシート作成
    const logSheet = getOrCreateLogSheet();
    Logger.log('✓ ログシート作成成功: ' + logSheet.getName());
    
    // テストログ追加
    addLog('初期化', 'システム初期化テスト');
    Logger.log('✓ ログ追加成功');
    
    // 初期データ保存テスト
    const testData = {
      scores: [],
      goal: 150,
      videos: []
    };
    saveData(testData);
    Logger.log('✓ 初期データ保存成功');
    
    // データ読み込みテスト
    const loadedData = loadData();
    Logger.log('✓ データ読み込み成功: ' + JSON.stringify(loadedData));
    
    Logger.log('\n========================================');
    Logger.log('✅ 初期化テスト完了!');
    Logger.log('次のステップ:');
    Logger.log('1. [公開] > [ウェブアプリケーションとして導入] を選択');
    Logger.log('2. 「次のユーザーとしてアプリケーションを実行」: 自分');
    Logger.log('3. 「アプリケーションにアクセスできるユーザー」: 全員');
    Logger.log('4. [導入] をクリック');
    Logger.log('5. 表示されたURLをHTMLファイルのAPI_URLに設定');
    Logger.log('========================================\n');
    
    return {
      success: true,
      message: '初期化成功'
    };
    
  } catch (error) {
    Logger.log('\n❌ エラーが発生しました:');
    Logger.log(error.toString());
    Logger.log('\n確認事項:');
    Logger.log('1. SPREADSHEET_IDが正しく設定されているか');
    Logger.log('2. スプレッドシートへのアクセス権限があるか');
    Logger.log('3. Google Apps Scriptの実行権限を許可したか');
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * データリセット（テスト用）
 * 注意: すべてのデータが削除されます
 */
function resetAllData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '確認',
    'すべてのデータを削除します。よろしいですか？',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // データシート削除
    const dataSheet = ss.getSheetByName('スコアデータ');
    if (dataSheet) {
      ss.deleteSheet(dataSheet);
    }
    
    // ログシート削除
    const logSheet = ss.getSheetByName('更新ログ');
    if (logSheet) {
      ss.deleteSheet(logSheet);
    }
    
    // 再作成
    getOrCreateDataSheet();
    getOrCreateLogSheet();
    addLog('リセット', 'すべてのデータをリセット');
    
    ui.alert('完了', 'データをリセットしました', ui.ButtonSet.OK);
  }
}

/**
 * データバックアップ（手動実行用）
 */
function backupData() {
  try {
    const data = loadData();
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd_HHmmss');
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let backupSheet = ss.getSheetByName('バックアップ_' + timestamp);
    
    if (!backupSheet) {
      backupSheet = ss.insertSheet('バックアップ_' + timestamp);
    }
    
    // データを整形して保存
    backupSheet.appendRow(['バックアップ日時', new Date()]);
    backupSheet.appendRow(['']);
    backupSheet.appendRow(['目標スコア', data.goal]);
    backupSheet.appendRow(['']);
    backupSheet.appendRow(['スコアデータ', 'JSON']);
    backupSheet.appendRow([JSON.stringify(data.scores, null, 2)]);
    backupSheet.appendRow(['']);
    backupSheet.appendRow(['動画データ', 'JSON']);
    backupSheet.appendRow([JSON.stringify(data.videos, null, 2)]);
    
    addLog('バックアップ', 'データバックアップ作成: ' + timestamp);
    
    SpreadsheetApp.getUi().alert('バックアップ完了', 
      'シート「バックアップ_' + timestamp + '」を作成しました', 
      SpreadsheetApp.getUi().ButtonSet.OK);
      
  } catch (error) {
    SpreadsheetApp.getUi().alert('エラー', 
      'バックアップに失敗しました: ' + error.toString(), 
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
