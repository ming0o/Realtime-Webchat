// API 설정
export const API_CONFIG = {
    BASE_URL: 'http://localhost:8080',
    TIMEOUT: 15000, // 15초로 증가
};

// 개발 환경에 따른 설정
export const getApiUrl = () => {
    // React Native에서 localhost 접근을 위한 설정
    // 실제 기기에서는 컴퓨터의 IP 주소를 사용해야 함
    return API_CONFIG.BASE_URL;
};
