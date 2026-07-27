import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { destination } = req.body;

  if (!destination) {
    return res.status(400).json({ error: '장소를 입력해주세요.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      사용자가 여름 휴가지로 "${destination}"(을)를 입력했습니다.
      이 장소에 어울리는 완벽한 여름 휴가 추천 및 여행 일정을 짜주세요.
      반드시 아래 JSON 형식으로만 응답해주세요. (마크다운 백틱 코드 블록 없이 순수 JSON 문자열로만 응답)
      
      {
        "description": "오른쪽에 표시할 상세한 여행지 설명 및 추천 이유 (HTML 태그 사용 가능, 예: <p>, <ul> 등)",
        "timetable": [
          {
            "time": "09:00",
            "title": "일정 제목",
            "task": "해야 할 구체적인 일이나 활동 내용"
          },
          {
            "time": "11:00",
            "title": "일정 제목",
            "task": "해야 할 구체적인 일이나 활동 내용"
          }
        ]
      }
      타임테이블은 하루 일정 기준으로 최소 4개 이상 작성해주세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text.trim();
    rawText = rawText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const data = JSON.parse(rawText);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: 'AI 응답을 생성하는 중 오류가 발생했습니다.' });
  }
}