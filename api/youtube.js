const play = require('play-dl');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const originalUrl = req.query.url;
        if (!originalUrl) {
            return res.status(400).json({ error: "URL이 제공되지 않았습니다." });
        }

        const videoInfo = await play.video_info(originalUrl);

        const audioFormats = videoInfo.format.filter(f => f.audio && !f.hasVideo);
        if (!audioFormats.length) {
            return res.status(500).json({ error: "오디오 스트림을 찾을 수 없습니다." });
        }

        const bestAudio = audioFormats.sort((a, b) => b.audioBitrate - a.audioBitrate)[0];

        res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate');
        res.status(200).json({
            title: videoInfo.video_details.title,
            channel: videoInfo.video_details.channel.name,
            thumbnail: videoInfo.video_details.thumbnails[0].url,
            streamUrl: bestAudio.url,
        });
    } catch (error) {
        console.error("!!! CRITICAL ERROR:", error);
        res.status(500).json({ error: "서버 내부 오류가 발생했습니다.", details: error.message });
    }
};
