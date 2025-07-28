// GPT APIサービス - 議事録分析機能
// Version: 2.0.1 - 実際のGPT API使用版
import OpenAI from 'openai';

// OpenAI APIクライアントの初期化
const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // クライアントサイドでの使用を許可
});

// ステータス定義
const STATUS_DEFINITIONS = {
  '与件化_提案中': 'MTGが終わっていて提案をこちらが作成するステータス',
  '受注': 'このMTGを持って、実際にサービスが受注されたステータス', 
  '失注': 'MTGの結果、サービスが導入されなかったステータス',
  '保留': '一旦サービス導入が見送られているが、長期的にはサービス導入の可能性があるステータス',
  '検討中': 'MTGが終わっていて提案を先方が検討しているステータス',
  '稼働終了': '追いかけもしない、完全に稼働が終了したステータス'
};

// プロンプトテンプレート
const createPrompt = (meetingNotes) => {
  return `下記の議事録を読み取って、以下の3つの項目を出力してください：

■ AI要約
この議事録を5行で要約してください。

■ アクションプラン  
この議事録の内容に基づいて、次に取るべき具体的なアクションを提案してください。
議事録の内容から適切な行動を推測し、実行可能で具体的なアクションを複数提案してください。
例：「提案書作成」「価格調整」「社内稟議」「デモ実施」「追加ヒアリング」「契約書準備」など

■ ステータス
以下の6つのステータスから最も適切なものを1つ選択してください：
- 与件化_提案中：MTGが終わっていて提案をこちらが作成するステータス
- 受注：このMTGを持って、実際にサービスが受注されたステータス
- 失注：MTGの結果、サービスが導入されなかったステータス
- 保留：一旦サービス導入が見送られているが、長期的にはサービス導入の可能性があるステータス
- 検討中：MTGが終わっていて提案を先方が検討しているステータス
- 稼働終了：追いかけもしない、完全に稼働が終了したステータス

議事録：
${meetingNotes}

※回答は上記の■で示した3つの項目のみを含めてください。他の情報は不要です。`;
};

/**
 * 議事録をGPTで分析してAI要約、アクションプラン、ステータスを取得
 * @param {string} meetingNotes - 議事録の内容
 * @returns {Promise<{summary: string, actionPlans: string[], status: string, error?: string}>}
 */
export const analyzeMeetingNotes = async (meetingNotes) => {
  try {
    console.log('🤖 GPT API: 議事録分析開始');
    console.log('📝 入力された議事録:', meetingNotes);
    console.log('🔑 APIキー:', API_KEY ? `${API_KEY.substring(0, 20)}...` : '未設定');
    
    // APIキーの確認
    if (!API_KEY) {
      throw new Error('OpenAI APIキーが設定されていません。');
    }

    // 入力検証
    if (!meetingNotes || meetingNotes.trim().length === 0) {
      throw new Error('議事録の内容が入力されていません。');
    }

    // デバッグモード: モックレスポンスを返す（開発中のテスト用）
    const USE_MOCK = false; // 本番環境ではfalseに設定
    console.log('🔧 モックモード:', USE_MOCK ? '有効' : '無効（実際のAPIを使用）');
    
    if (USE_MOCK) {
      console.log('🔧 デバッグモード: モックレスポンスを使用');
      
      // 議事録の内容に基づいて動的にモックレスポンスを生成
      const mockResponse = generateMockResponse(meetingNotes);
      const parsed = parseGPTResponse(mockResponse);
      
      console.log('✅ モックレスポンス生成完了');
      return {
        summary: parsed.summary,
        actionPlans: parsed.actionPlans,
        status: parsed.status,
        rawResponse: mockResponse
      };
    }

    // プロンプトを生成
    const prompt = createPrompt(meetingNotes);
    console.log('📨 送信するプロンプト:');
    console.log(prompt);
    console.log('='.repeat(50));
    
    // GPT APIリクエスト
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // コスト効率的なモデルを使用
      messages: [
        {
          role: 'system',
          content: 'あなたは営業支援AIです。議事録を分析して、次のアクションプランと適切なステータスを提案してください。回答は簡潔で実行可能な内容にしてください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3, // 一貫性を重視
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    const analysisResult = response.choices[0]?.message?.content;
    
    if (!analysisResult) {
      throw new Error('GPTからの応答が取得できませんでした。');
    }

    console.log('✅ GPT API: 分析完了');
    console.log('📝 生のGPT応答:');
    console.log(analysisResult);
    console.log('='.repeat(50));

    // レスポンスを解析
    const parsed = parseGPTResponse(analysisResult);
    
    console.log('📊 解析結果:');
    console.log('- 要約:', parsed.summary);
    console.log('- アクションプラン:', parsed.actionPlans);
    console.log('- ステータス:', parsed.status);
    console.log('='.repeat(50));
    
    return {
      summary: parsed.summary,
      actionPlans: parsed.actionPlans,
      status: parsed.status,
      rawResponse: analysisResult
    };

  } catch (error) {
    console.error('💥 GPT API エラー:', error);
    
    // エラーの種類に応じて適切なメッセージを返す
    let errorMessage = 'AI分析中にエラーが発生しました。';
    
    if (error.message.includes('API key')) {
      errorMessage = 'OpenAI APIキーの設定に問題があります。';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'API利用制限に達しました。しばらく時間をおいてからお試しください。';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'API接続がタイムアウトしました。もう一度お試しください。';
    }
    
    return {
      summary: '',
      actionPlans: [],
      status: '',
      error: errorMessage
    };
  }
};

/**
 * 議事録の内容に基づいてモックレスポンスを生成
 * @param {string} meetingNotes - 議事録の内容
 * @returns {string} モックレスポンス
 */
const generateMockResponse = (meetingNotes) => {
  // 議事録から重要なキーワードを抽出
  const keywords = meetingNotes.toLowerCase();
  
  // ステータスを決定
  let status = '検討中';
  if (keywords.includes('受注') || keywords.includes('契約') || keywords.includes('確定')) {
    status = '受注';
  } else if (keywords.includes('失注') || keywords.includes('見送り') || keywords.includes('不採用')) {
    status = '失注';
  } else if (keywords.includes('保留') || keywords.includes('延期') || keywords.includes('ペンディング')) {
    status = '保留';
  } else if (keywords.includes('提案') || keywords.includes('見積') || keywords.includes('資料')) {
    status = '与件化_提案中';
  } else if (keywords.includes('終了') || keywords.includes('完了') || keywords.includes('クローズ')) {
    status = '稼働終了';
  } else if (keywords.includes('検討中') || keywords.includes('比較') || keywords.includes('評価')) {
    status = '検討中';
  }
  
  // アクションプランを生成
  const actionPlans = [];
  if (keywords.includes('提案')) {
    actionPlans.push('詳細提案書の作成');
  }
  if (keywords.includes('見積')) {
    actionPlans.push('見積書の作成と送付');
  }
  if (keywords.includes('予算')) {
    actionPlans.push('予算に合わせた価格調整の検討');
  }
  if (keywords.includes('競合')) {
    actionPlans.push('競合他社との比較表の作成');
  }
  if (keywords.includes('技術') || keywords.includes('仕様')) {
    actionPlans.push('技術仕様書の準備');
  }
  if (keywords.includes('デモ') || keywords.includes('実演')) {
    actionPlans.push('デモ環境の準備と実施');
  }
  if (keywords.includes('決裁') || keywords.includes('部長') || keywords.includes('役員')) {
    actionPlans.push('エグゼクティブサマリーの作成');
  }
  if (keywords.includes('mtg') || keywords.includes('ミーティング') || keywords.includes('打ち合わせ')) {
    actionPlans.push('次回ミーティングの日程調整');
  }
  
  // アクションプランが空の場合、デフォルトを追加
  if (actionPlans.length === 0) {
    actionPlans.push('ヒアリング内容の整理と社内共有');
    actionPlans.push('次回アクションの検討');
  }
  
  // 要約を生成（最初の200文字を使用）
  const summaryText = meetingNotes.substring(0, 200).split('\n').filter(line => line.trim()).slice(0, 5);
  const summary = summaryText.length > 0 
    ? summaryText.join('\n') 
    : '本日の商談内容を確認し、次のステップを検討しました。';
  
  // モックレスポンスを返す
  return `■ AI要約
${summary}

■ アクションプラン
${actionPlans.map(plan => `・${plan}`).join('\n')}

■ ステータス
${status}`;
};

/**
 * GPTのレスポンスを解析してAI要約、アクションプラン、ステータスを抽出
 * @param {string} response - GPTからの生の応答
 * @returns {{summary: string, actionPlans: string[], status: string}}
 */
export const parseGPTResponse = (response) => {
  let summary = '';
  const actionPlans = [];
  let status = '';
  
  try {
    const lines = response.split('\n').filter(line => line.trim());
    
    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // セクション判定
      if (trimmedLine.includes('AI要約') || trimmedLine.includes('要約')) {
        currentSection = 'summary';
        continue;
      } else if (trimmedLine.includes('アクションプラン') || trimmedLine.includes('アクション')) {
        currentSection = 'action';
        continue;
      } else if (trimmedLine.includes('ステータス')) {
        currentSection = 'status';
        continue;
      }
      
      // 内容抽出
      if (currentSection === 'summary' && trimmedLine) {
        // 要約セクションの内容を蓄積
        if (!trimmedLine.includes('■') && !trimmedLine.includes('要約')) {
          summary += (summary ? '\n' : '') + trimmedLine;
        }
      } else if (currentSection === 'action' && trimmedLine) {
        // リストマーカーを除去
        const cleanAction = trimmedLine
          .replace(/^[・•\-\*\d+\.]\s*/, '')
          .replace(/^[\-\*]\s*/, '')
          .trim();
        
        if (cleanAction && !cleanAction.includes('アクションプラン') && !cleanAction.includes('■')) {
          actionPlans.push(cleanAction);
        }
      } else if (currentSection === 'status' && trimmedLine) {
        // ステータスを抽出（定義済みステータスのいずれかを探す）
        const validStatuses = Object.keys(STATUS_DEFINITIONS);
        for (const validStatus of validStatuses) {
          if (trimmedLine.includes(validStatus)) {
            status = validStatus;
            break;
          }
        }
      }
    }
    
    // フォールバック：正規表現でより柔軟に抽出
    if (!summary) {
      const summaryMatch = response.match(/■\s*AI要約[：:\s]*(.*?)(?=■|$)/s);
      if (summaryMatch) {
        summary = summaryMatch[1].trim();
      }
    }
    
    if (actionPlans.length === 0) {
      const actionMatch = response.match(/■\s*アクションプラン[：:\s]*(.*?)(?=■|$)/s);
      if (actionMatch) {
        const actionText = actionMatch[1].trim();
        // 複数のアクションを分割
        const actions = actionText.split(/\n|、|。/).filter(action => 
          action.trim() && !action.includes('例：')
        );
        actionPlans.push(...actions.map(action => action.trim()));
      }
    }
    
    if (!status) {
      const validStatuses = Object.keys(STATUS_DEFINITIONS);
      for (const validStatus of validStatuses) {
        if (response.includes(validStatus)) {
          status = validStatus;
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('レスポンス解析エラー:', error);
  }
  
  return {
    summary: summary || '要約を抽出できませんでした',
    actionPlans: actionPlans.length > 0 ? actionPlans : ['分析結果から具体的なアクションを抽出できませんでした'],
    status: status || '検討中' // デフォルトステータス
  };
};

/**
 * 利用可能なステータス一覧を取得
 * @returns {Array<{value: string, label: string, description: string}>}
 */
export const getAvailableStatuses = () => {
  return Object.entries(STATUS_DEFINITIONS).map(([value, description]) => ({
    value,
    label: value,
    description
  }));
};

/**
 * APIキーが設定されているかチェック
 * @returns {boolean}
 */
export const isGPTServiceAvailable = () => {
  return !!API_KEY;
};