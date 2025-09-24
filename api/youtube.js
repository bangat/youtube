/* ○○○○○ youtube.js 시작 ○○○○○ */
const play = require('play-dl');
const cors = require('cors');

const corsMiddleware = cors({ origin: '*' });

module.exports = (req, res) => {
    corsMiddleware(req, res, async () => {
        try {
            const originalUrl = req.query.url;
            if (!originalUrl) return res.status(400).json({ error: "URL이 제공되지 않았습니다." });

            const videoInfo = await play.video_info(originalUrl);

            const audioFormats = videoInfo.format.filter(f => f.audio && !f.hasVideo);
            if (!audioFormats.length) return res.status(500).json({ error: "오디오 스트림을 찾을 수 없습니다." });

            const bestAudio = audioFormats.sort((a, b) => b.audioBitrate - a.audioBitrate)[0];

            const responseData = {
                title: videoInfo.video_details.title,
                channel: videoInfo.video_details.channel.name,
                thumbnail: videoInfo.video_details.thumbnails.slice(-1)[0].url,
                streamUrl: bestAudio.url,
            };

            res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate');
            res.status(200).json(responseData);

        } catch (error) {
            console.error("!!! CRITICAL ERROR:", error);
            res.status(500).json({
                error: "서버 내부 오류가 발생했습니다.",
                details: error.message,
                hint: "비공개, 삭제, 나이제한 영상일 수 있습니다."
            });
        }
    });
};
/* ○○○○○ youtube.js 종료 ○○○○○ */
