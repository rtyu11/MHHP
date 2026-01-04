# Masato Hayashi Official Website  
## 仕様書（README）

---

## 1. サイト概要

### 目的
- **仕事依頼の獲得を最優先**
- アーティスト *HAYASHI MASATO* の認知度向上
- 検索・SNS流入を意識した情報発信（SEO対応）

### コンセプト
- ラッパー *HAYASHI MASATO* に合った  
  **クール / ダーク / リッチ**
- 「100万円以上かけて制作されたように見える」質感
- 派手さより **余白・重さ・静かな強さ**

### 明確なNG
- ポップ・かわいい表現
- 明るい白ベースのデザイン
- 子供向け・軽い印象

---

## 2. 公開・環境

- 公開形態：独自ドメイン
- サーバー：レンタルサーバー
- リポジトリ管理：GitHub
- 更新担当：アーティストマネージャー1名（非エンジニア）
- 更新方法：Googleスプレッドシートのみ操作
- 計測：Google Tag 実装、Google Analytics 導入

---

## 3. ページ構成

- Top（Hero / News / Contact）
- News（一覧 + 詳細表示）
- Privacy Policy

※ 事務所表記ページは設けない

---

## 4. データ管理（Googleスプレッドシート）

### シート方針
- **1シート運用**
- NEWS と HERO下の帯（TICKER）を同一シートで管理
- シート編集以外の操作は不要

### 列定義

| 列名 | 内容 | 必須 |
|---|---|---|
| type | `news` / `ticker` | ○ |
| publish | 表示ON/OFF（チェック） | ○ |
| date | 公開日（YYYY-MM-DD） | ○ |
| title | NEWSタイトル | newsのみ |
| body | NEWS本文 / 帯に流す文言 | ○ |
| link_url | 外部リンクURL | 任意 |
| link_label | リンク表示文言 | 任意 |

### 共通ルール
- `publish = TRUE` のみ表示対象
- `date` が未来日のものは表示しない（予約投稿扱い）
- 削除せず **OFF運用** を基本とする（履歴保持）

---

## 5. NEWS 表示仕様

### トップページ
- 最新 **5件** を表示
- 日付の新しい順に並べる
- 公開から **14日以内** の記事に `NEW` バッジ表示

### 詳細表示
- 記事クリックで BODY 全文を表示
- `link_url` がある場合、本文下にリンクを表示

### 6件目以降
- トップには表示しない
- スクロールまたは「もっと読む」で確認

---

## 6. HERO下 帯（TICKER）仕様

- `type = ticker` の行を使用
- 複数文言を **ループ表示**
- 内容は LIVE 情報に限定しない
- 外部リンク設定可（帯全体リンク）

### 表示条件
- `publish = TRUE`
- 表示順は `date` 昇順、またはシート順（実装時に固定）

### 取得失敗時
- 固定文言を表示（例：`OFFICIAL SITE`）

---

## 7. コンタクトフォーム仕様（最重要）

### 目的
- **仕事依頼を最優先**
- ファンからの軽いメッセージも受け付ける

### UI方針
- 要件は **プルダウン選択**
  - 仕事依頼
  - 出演相談
  - コラボ相談
  - 応援・メッセージ
- 補足として  
  「このような内容も受け付けています」を小さく表示

### フォーム仕様
- 送信先：1アドレス固定
- 自動返信：なし
- 添付ファイル：不可

### セキュリティ
- スパム対策を実装
- 厳しすぎて仕事依頼を弾かない設計
- 連続送信・BOT対策を考慮

---

## 8. SEO / 計測

- ページごとに title / description を設定
- OGP 対応（SNS共有時）
- News 記事は検索に拾われる構造にする
- Google Analytics にて以下を計測
  - 問い合わせ送信
  - 外部リンク（BASE / YouTube）クリック

---

## 9. パフォーマンス方針

- スマホ最優先（Android含む）
- Hero動画は初期読み込みを阻害しない設計
- 演出は端末性能に応じて間引き可能
- 「重い」ではなく「遅く見せない」

---

## 10. プライバシーポリシー

- 内容は本サイト仕様に合わせて調整可
- フォーム・計測・外部リンクに言及する

---

## 11. 運用ルール（マネージャー向け）

1. NEWSを出す  
　→ シートに `type=news` の行を追加し `publish` をON  
2. 帯を変える  
　→ `type=ticker` の行を追加し、不要な行はOFF  
3. 表示がおかしい  
　→ `publish` / `date` を確認  
4. コードやGitHubは触らない

---

## 12. 完成判定チェックリスト

- [ ] シート更新だけで NEWS / 帯が反映される  
- [ ] 最新5件 + NEW表示が正しく動く  
- [ ] HERO下帯が複数文言でループする  
- [ ] 仕事依頼が迷わず送れる  
- [ ] スマホで破綻しない  
- [ ] 計測・SEOが有効  

---

## 13. デプロイ・公開環境（Vercel）

### 公開形態
- **静的サイト**としてVercelにデプロイ
- `index.html` / `main.js` / `styles.css` のみで動作
- **PHPは一切使用しない**（Vercelでは動作しないため）

### 注意事項
- `token.php` はこのサイトでは**使用しない・参照しない**
  - リポジトリに含まれているが、Vercelデプロイ時は無視される
  - フォーム送信は Google Apps Script 経由で行うため、PHPは不要

### 問い合わせフォームの仕組み

#### 送信フロー
1. `index.html` の `#contact-form` にユーザーが入力
2. `main.js` の `setupForm()` が送信を処理
3. Google Apps Script（`API_URL`）へ POST/GET リクエスト送信
4. 送信データ: `name`, `email`, `message`, `category`, `website`（ハニーポット）, `timestamp`

#### スパム対策
- **website ハニーポット**: `website` フィールドに値が入っている場合は送信拒否（人間は見えないフィールド）
- **送信間隔制限**: 1分以内の連続送信を防止（localStorageで管理）
- **ページ表示待ち**: ページ表示から3秒経過しないと送信不可（BOT対策）

#### 送信先メールアドレスの変更について
- **重要**: メール送信はフロントエンド（`main.js`）から直接SMTP送信**しない**
  - 秘密情報（SMTP認証情報など）が漏洩するため
- **正しい変更方法**: Google Apps Script 側でメール送信/転送の設定を変更する
  - `info@masatohayashi.jp` などに送信したい場合は、GASのコード内でメール送信先を変更
  - フロントエンド側の変更は不要

#### Vercelでの動作確認
1. Vercelにデプロイ後、問い合わせフォーム（CONTACTセクション）にアクセス
2. 必須項目を入力して送信
3. `#form-status` に成功メッセージが表示されることを確認
4. 送信成功後、メッセージは8秒間表示され、その後自動的に薄くなる

---

## 14. Vercelデプロイ手順

### GitHub連携によるデプロイ

1. **GitHubリポジトリの準備**
   - このリポジトリをGitHubにプッシュ
   - リポジトリは公開/非公開どちらでも可

2. **Vercelアカウントの準備**
   - [Vercel](https://vercel.com)にアカウントを作成
   - GitHubアカウントと連携

3. **プロジェクトのインポート**
   - Vercelダッシュボードで「New Project」をクリック
   - GitHubリポジトリを選択
   - プロジェクト設定：
     - **Framework Preset**: Other
     - **Root Directory**: `./`（ルートディレクトリ）
     - **Build Command**: （空欄のまま）
     - **Output Directory**: （空欄のまま）

4. **環境変数の設定**
   - プロジェクト設定の「Environment Variables」に以下を追加：
     - `SPOTIFY_CLIENT_ID`: Spotify APIのClient ID
     - `SPOTIFY_CLIENT_SECRET`: Spotify APIのClient Secret
     - `SPOTIFY_ARTIST_ID`: SpotifyアーティストID

5. **API Routesの作成**
   - `api/spotify.js` はVercelのServerless Functionとして自動認識される
   - `api/contact.js` を作成してフォーム送信を処理（Google Apps Script等と連携）

6. **デプロイ**
   - 「Deploy」ボタンをクリック
   - デプロイ完了後、提供されるURLで動作確認

### 相対API_URL設計について

- `main.js` の `API_URL` は `/api/contact` という相対パスを使用
- これにより、Vercelのデプロイ先URLが変わっても自動的に正しいエンドポイントを参照
- 本番環境と開発環境で同じコードが動作する

---

## 15. フォーム送信フロー

### リクエスト形式

フォーム送信時、以下のデータが `/api/contact` にPOSTリクエストとして送信されます：

```json
{
  "name": "ユーザー名",
  "email": "user@example.com",
  "message": "メッセージ内容",
  "category": "work|appearance|inquiry|other",
  "website": "",  // ハニーポット（通常は空）
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### レスポンス形式

#### 成功時
- HTTPステータス: `200 OK`
- レスポンス本文: 任意（Google Apps Script等の実装に依存）

#### エラー時
- HTTPステータス: `400 Bad Request` または `500 Internal Server Error`
- レスポンス本文: JSON形式でエラーメッセージを含む（推奨）
  ```json
  {
    "error": "エラーメッセージ",
    "message": "詳細なエラーメッセージ（任意）"
  }
  ```

### エラーハンドリング

- **ネットワークエラー**: インターネット接続を確認するメッセージを表示
- **HTTPエラー**: レスポンス内容に応じたメッセージを表示
- **送信中**: ボタンを `disabled` にして二重送信を防止
- **成功メッセージ**: 3秒表示後、500msかけてフェードアウト

---

## 16. Spotifyデータ取得とキャッシュの流れ

### APIレスポンス形式

`/api/spotify` は必ず以下のJSON形式を返します：

```json
{
  "success": true,
  "data": {
    "artistId": "アーティストID",
    "albums": [
      {
        "id": "アルバムID",
        "name": "アルバム名",
        "album_type": "album|single",
        "image": "画像URL",
        "release_date": "2025-01-01",
        "external_url": "Spotify URL",
        "tracks": [...]
      }
    ]
  },
  "message": null
}
```

エラー時：
```json
{
  "success": false,
  "data": null,
  "message": "エラーメッセージ"
}
```

### localStorageキャッシュの仕組み

1. **キャッシュキー**: `spotify_cache_v1`（バージョンを含む）
2. **保存形式**:
   ```json
   {
     "timestamp": 1234567890000,
     "data": {
       "artistId": "...",
       "albums": [...]
     }
   }
   ```
3. **有効期限**: 24時間（`CACHE_MAX_AGE = 24 * 60 * 60 * 1000`）
4. **動作フロー**:
   - ページ読み込み時、まず `localStorage` からキャッシュを読み込み
   - 有効なキャッシュがあれば即座に表示
   - 並行して `/api/spotify` にリクエストを送信
   - 成功時はキャッシュを更新して再レンダリング
   - 失敗時は有効なキャッシュがあればそれを維持（エラー表示しない）

### サーバー側キャッシュ（api/spotify.js）

1. **メモリキャッシュ**: warm instance内で24時間保持
2. **トークンキャッシュ**: アクセストークンをexpires_inに基づいてキャッシュ（60秒のマージン）
3. **Cache-Control**: `s-maxage=86400, stale-while-revalidate=604800`（24時間キャッシュ、1週間stale許可）
4. **エラー時**: staleキャッシュがあればそれを返す（可能な限りデータを提供）

### エラーハンドリング

- **localStorage操作**: すべて `try/catch` で安全に処理
- **JSON.parse**: パースエラー時は `null` を返し、処理を継続
- **DOM存在チェック**: DOM要素が存在しない場合は何もしない
- **fetch失敗時**: 有効なキャッシュがあればそれを使用し、エラー表示しない

---

## 17. INFORMATION API（Google Apps Script）仕様

### エンドポイント
- Google Apps ScriptのWebアプリとして公開されたURL（`NEWS_API_URL`）

### レスポンス形式

#### 成功時
配列形式で返す：
```json
[
  {
    "type": "news",
    "publish": true,
    "date": "2025-12-01",
    "title": "ニュースタイトル",
    "body": "本文",
    "link_url": "https://example.com",
    "link_label": "リンクラベル"
  },
  {
    "type": "ticker",
    "publish": true,
    "date": "2025-12-01",
    "body": "帯に表示する文言",
    "link_url": "https://example.com",
    "link_label": "リンクラベル"
  }
]
```

#### エラー時
```json
{
  "error": "エラーメッセージ"
}
```

### データ仕様

1. **type**: `"news"` または `"ticker"` のみ出力（空行やその他の値は除外）
2. **publish**: チェックボックスの真偽値（`true`/`false`）のまま返す（文字列化しない）
3. **date**: Date型の場合はAsia/Tokyoタイムゾーンで `YYYY-MM-DD` 形式の文字列に変換して返す
4. **空行**: `type`が空の行は出力しない

### フロントエンド側の対応

`main.js`は以下の形式の揺れに対応：
- 配列形式: `[{...}, {...}]`
- オブジェクト形式: `{items: [{...}, {...}]}`
- グループ化形式: `{news: [{...}], ticker: [{...}]}`

また、`publish`と`date`の型揺れにも対応：
- `publish`: `true`/`false`、`"TRUE"`/`"FALSE"`、`"true"`/`"false"`、`1`/`0` を正規化
- `date`: `YYYY-MM-DD`形式、ISO文字列（`2025-01-01T00:00:00.000Z`など）に対応

---

### 補足
この README は **仕様書・運用マニュアル・引き継ぎ資料** を兼ねる。
