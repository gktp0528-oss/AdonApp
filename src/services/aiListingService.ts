import { getGenerativeModel } from "firebase/ai";
import { aiBackend } from '../firebaseConfig';
import { UnifiedAiReport } from '../types/listing';
import * as ImageManipulator from 'expo-image-manipulator';
import ALL_CATEGORIES from '../data/categories.json';

type CategoryItem = {
    id: string;
    name: string;
    parentId: string | null;
    isLeaf: boolean;
};

// 모든 리프(Leaf) 카테고리의 전체 경로를 생성합니다.
const generateCategoryPaths = () => {
    const map = new Map<string, CategoryItem>();
    (ALL_CATEGORIES as CategoryItem[]).forEach(c => map.set(c.id, c));

    const getPath = (c: CategoryItem): string => {
        let p = c.name;
        let curr = c;
        while (curr.parentId) {
            const parent = map.get(curr.parentId);
            if (!parent) break;
            curr = parent;
            p = curr.name + ' - ' + p;
        }
        return p;
    };

    return (ALL_CATEGORIES as CategoryItem[])
        .filter(c => c.isLeaf)
        .map(getPath);
};

const CATEGORY_PATHS = generateCategoryPaths();

export const aiListingService = {
    /**
     * 이미지를 AI 분석에 적합한 크기로 최적화합니다.
     */
    async processImage(uri: string, width: number = 1024): Promise<string> {
        try {
            const manipulResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width } }],
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manipulResult.uri;
        } catch (error) {
            console.warn('Image processing failed, using original:', error);
            return uri;
        }
    },

    /**
     * 상품 이미지를 분석하여 리포트와 가격 범위를 생성합니다.
     */
    async analyzeListing(uris: string[], targetLang: string): Promise<UnifiedAiReport | null> {
        try {
            const model = getGenerativeModel(aiBackend, { model: "gemini-3-flash-preview" });

            const imageParts = await Promise.all(uris.map(async (uri) => {
                const resp = await fetch(uri);
                const b = await resp.blob();
                const base64: string = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.readAsDataURL(b);
                });
                return {
                    inlineData: {
                        data: base64,
                        mimeType: "image/jpeg",
                    },
                };
            }));

            const prompt = `당신은 헝가리(Hungary) 및 유럽 중고 마켓(Jofogas, Vinted, eBay) 시세에 정통한 매우 보수적이고 객관적인 가격 책정 전문가입니다.
      
      [분석 지침]
      1. **정밀 식별**: 사진 속 텍스트, 모델명, 로고를 추출하여 정확한 제품명을 식별하세요.
      2. **상태 분석**: 미세한 스크래치, 사용감 등 감가 요인을 철저히 찾아내어 엄격하게 점수를 매기세요.
      3. **로컬 시장 대조**: 헝가리 현지 최저가 사이트(arukereso.hu)와 중고 거래가를 반영하세요.
      4. **화폐 단위**: 반드시 'HUF (Hungarian Forint)' 기준으로 하며, 숫자가 현지 물가에 맞아야 합니다.
      5. **카테고리 선택**: 아래 제공된 [유효한 카테고리 경로 목록] 중 가장 적합한 **하나의 전체 경로**를 선택하세요. (예: Digital & Tech - Cameras - Other)
      
      [유효한 카테고리 경로 목록]:
      ${CATEGORY_PATHS.join('\n      ')}

      다음 JSON 형식으로 상세 리포트를 작성해주세요:
      {
        "itemName": "식별된 정확한 모델명",
        "category": "위 목록에서 선택한 전체 경로",
        "conditionScore": 1~10 사이 점수,
        "marketDemand": "헝가리 내 수요 (High/Medium/Low)",
        "priceRange": { "min": 보수적 최소 포린트, "max": 현실적 최대 포린트 },
        "insights": ["시세 대비 분석", "감가 요인 및 보수적 평가"],
        "reasoning": "왜 이 가격인가? 구체적인 하자와 시장 상황을 근거로 설명"
      }
      MUST be written in ${targetLang}.`;

            const result = await model.generateContent([prompt, ...imageParts]);
            const responseText = (await result.response).text();

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

            if (!data) return null;

            // 데이터 정규화 및 보정
            const score = Number(data.conditionScore);
            const normalizedScore = Number.isFinite(score) ? Math.max(1, Math.min(10, Math.round(score))) : null;

            let normalizedPriceRange = null;
            if (data.priceRange && typeof data.priceRange.min === 'number' && typeof data.priceRange.max === 'number') {
                const min = Math.max(0, Math.round(data.priceRange.min));
                const max = Math.max(0, Math.round(data.priceRange.max));
                normalizedPriceRange = min <= max ? { min, max } : { min: max, max: min };
            }

            return {
                itemName: data.itemName || '분석 상품',
                category: data.category || 'fashion',
                marketDemand: data.marketDemand || 'Medium',
                conditionScore: normalizedScore,
                priceRange: normalizedPriceRange,
                insights: Array.isArray(data.insights) ? data.insights.slice(0, 4) : [],
                reasoning: data.reasoning || data.description || '리포트 내용이 없습니다.',
            };

        } catch (error) {
            console.error('Unified AI Analysis failed:', error);
            return null;
        }
    }
};
