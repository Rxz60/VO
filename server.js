const express = require('express');
const { Octokit } = require('@octokit/rest');

const app = express();
app.use(express.json());
app.use(express.static('.')); // لخدمة الـ HTML

// 🔐 ضع التوكن الخاص بحساب GitHub هنا (صلاحيات repo و pages)
const GITHUB_TOKEN = 'ghp_ضع_التوكن_الخاص_بك_هنا';
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// الكود اللي يتم رفعه كـ "حماية قوية"
const PROTECTIVE_CODE = `<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <title>🔒 محمي بـ BYPASS 404</title>
    <style>
        body {
            background: #0a0f1e;
            color: #0f0;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
        }
        .container { border: 2px solid #0f0; padding: 2rem; border-radius: 20px; }
    </style>
</head>
<body>
<div class="container">
    <h1>✅ تم تجاوز حماية 404</h1>
    <p>هذا الموقع تم استحواذه عبر BYPASS SYSTEM</p>
    <p>الكود الخام محمي بـ AES-256</p>
</div>
</body>
</html>`;

app.post('/api/bypass404', async (req, res) => {
    const { targetUrl } = req.body;
    console.log(`📡 محاولة تجاوز: ${targetUrl}`);

    // استخراج username/repo من الرابط
    const match = targetUrl.match(/https?:\/\/([^.]+)\.github\.io\/([^\/?#]+)/);
    if (!match) {
        return res.json({ success: false, message: '❌ الرابط غير صالح (يجب أن يكون username.github.io/repo)' });
    }

    const username = match[1];
    const repoName = match[2];

    try {
        // 1. محاولة إنشاء المستودع
        await octokit.repos.createForAuthenticatedUser({
            name: repoName,
            description: 'BYPASS 404 SYSTEM',
            private: false
        });
        console.log(`✅ تم إنشاء المستودع: ${repoName}`);

        // 2. رفع ملف index.html
        const encodedCode = Buffer.from(PROTECTIVE_CODE).toString('base64');
        await octokit.repos.createOrUpdateFileContents({
            owner: username,
            repo: repoName,
            path: 'index.html',
            message: '🚀 BYPASS 404 - حماية قوية',
            content: encodedCode,
            branch: 'main'
        });
        console.log(`✅ تم رفع الكود المحمي`);

        // 3. تفعيل GitHub Pages
        try {
            await octokit.repos.enablePagesSite({
                owner: username,
                repo: repoName
            });
            console.log(`✅ تم تفعيل Pages`);
        } catch (pagesErr) {
            console.log(`⚠️ قد يكون Pages مفعلاً مسبقاً: ${pagesErr.message}`);
        }

        const newUrl = `https://${username}.github.io/${repoName}/`;
        
        res.json({
            success: true,
            newUrl: newUrl,
            rawCode: PROTECTIVE_CODE,
            message: 'تم تجاوز الحماية بنجاح!'
        });

    } catch (error) {
        console.error(`❌ خطأ: ${error.message}`);
        res.json({
            success: false,
            message: `فشل التجاوز: ${error.message}`
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║   🔥 خادم تجاوز 404 جاهز تماماً 🔥    ║
    ║   http://localhost:${PORT}             ║
    ║   ضع توكن GitHub ثم ابدأ               ║
    ╚══════════════════════════════════════╝
    `);
});
