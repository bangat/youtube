const play = require('play-dl');
const cors = require('cors');

// CORS 미들웨어 초기화
const corsMiddleware = cors({ origin: '*' });

// Vercel 환경에서 함수를 내보내는 방식
module.exports = (req, res) => {
    corsMiddleware(req, res, async () => {
        try {
            const originalUrl = req.query.url;
            if (!originalUrl) {
                return res.status(400).json({ error: "URL이 제공되지 않았습니다." });
            }

            const videoInfo = await play.video_info(originalUrl);
            const stream = await play.stream_from_info(videoInfo, { type: 'audio' });

            if (!stream || !stream.url) {
                return res.status(500).json({ error: "재생 가능한 오디오 스트림을 찾을 수 없습니다." });
            }

            const responseData = {
                title: videoInfo.video_details.title,
                channel: videoInfo.video_details.channel.name,
                thumbnail: videoInfo.video_details.thumbnails[0].url,
                streamUrl: stream.url,
            };
            
            // Vercel 캐시 설정: 6시간 동안 동일한 요청은 캐시된 결과를 사용
            res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate');
            res.status(200).json(responseData);

        } catch (error) {
            console.error("!!! CRITICAL ERROR:", error);
            res.status(500).json({ error: "서버 내부 오류가 발생했습니다.", details: error.message });
        }
    });
};
