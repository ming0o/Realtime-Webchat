const { pool } = require('./database');

const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();

    await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        social_type ENUM('KAKAO', 'GUEST') NOT NULL,
        social_id VARCHAR(255) NULL,
        nickname VARCHAR(100) NOT NULL,
        token VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        status ENUM('접수', '응대', '종료', '보류') DEFAULT '접수',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 기존 chat_rooms 테이블에 status 컬럼이 없다면 추가
    try {
      await connection.execute(`
        ALTER TABLE chat_rooms 
        ADD COLUMN status ENUM('접수', '응대', '종료', '보류') DEFAULT '접수'
      `);
    } catch (error) {
      // 컬럼이 이미 존재하는 경우 무시
      console.log('status 컬럼이 이미 존재합니다.');
    }

    // 매크로 템플릿 테이블 수정 - 더 많은 타입과 사용자 구분 추가
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS macro_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        macro_type VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        sender_type ENUM('BOT', 'ADMIN') DEFAULT 'BOT',
        category VARCHAR(50) DEFAULT 'general',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_macro (macro_type, sender_type)
      )
    `);

    // 기존 테이블에 새로운 컬럼 추가 (이미 존재하는 경우 무시)
    try {
      await connection.execute(`
        ALTER TABLE macro_templates 
        ADD COLUMN sender_type ENUM('BOT', 'ADMIN') DEFAULT 'BOT'
      `);
    } catch (error) {
      console.log('sender_type 컬럼이 이미 존재합니다.');
    }

    try {
      await connection.execute(`
        ALTER TABLE macro_templates 
        ADD COLUMN category VARCHAR(50) DEFAULT 'general'
      `);
    } catch (error) {
      console.log('category 컬럼이 이미 존재합니다.');
    }

    // macro_type 컬럼의 길이를 늘리기 (기존 ENUM에서 VARCHAR로 변경)
    try {
      await connection.execute(`
        ALTER TABLE macro_templates 
        MODIFY COLUMN macro_type VARCHAR(50) NOT NULL
      `);
    } catch (error) {
      console.log('macro_type 컬럼 수정 중 오류:', error.message);
    }

    // 기존 데이터 삭제 후 새로운 매크로 데이터 삽입
    await connection.execute(`DELETE FROM macro_templates`);

    // 봇 매크로 (자동 응답)
    await connection.execute(`
        INSERT INTO macro_templates (macro_type, name, description, content, sender_type, category) VALUES
        ('off-hours', '업무외 시간 안내', '업무시간이 아닐 때 자동 안내', '지금은 업무시간이 아닙니다. 업무시간은 평일 오전 9시부터 오후 6시까지이며, 홈페이지에 방문하시면 자세한 사항을 확인하실 수 있습니다.', 'BOT', 'auto-response'),
        ('lunch-time', '점심시간 안내', '점심시간(11:30-13:00) 자동 안내', '오전 11시 30분부터 1시까지는 점심시간으로 통화 연결이 어렵습니다. 오후 1시 이후 다시 한번 연락 주시면 친절히 상담 드리겠습니다. 감사합니다.', 'BOT', 'auto-response'),
        ('holiday', '휴일 안내', '주말 휴일 자동 안내', '주말은 휴일입니다. 업무시간에 다시 연락 부탁드립니다. 업무시간은 평일 오전 9시부터 오후 6시까지입니다. 감사합니다.', 'BOT', 'auto-response'),
        ('agent-connect', '상담원 연결 안내', '상담원 연결 시 안내', '상담원이 연결되었습니다. 잠시만 기다려 주세요.', 'BOT', 'connection'),
        ('welcome', '환영 인사', '고객 환영 인사', '안녕하세요! 고객님을 환영합니다. 무엇을 도와드릴까요?', 'BOT', 'greeting')
      `);

    // 상담원 매크로 (수동 사용)
    await connection.execute(`
        INSERT INTO macro_templates (macro_type, name, description, content, sender_type, category) VALUES
        ('greeting', '인사말', '고객과의 첫 인사', '안녕하세요! 고객님, 무엇을 도와드릴까요?', 'ADMIN', 'greeting'),
        ('thanks', '감사 인사', '고객에게 감사 표현', '도움이 되었다니 기쁩니다. 더 궁금한 점이 있으시면 언제든 연락 주세요!', 'ADMIN', 'closing'),
        ('closing', '마무리 인사', '상담 종료 시 인사', '상담이 완료되었습니다. 이용해 주셔서 감사합니다. 좋은 하루 되세요!', 'ADMIN', 'closing'),
        ('wait', '잠시 대기 요청', '고객에게 잠시 대기 요청', '잠시만 기다려 주세요. 곧 확인해 드리겠습니다.', 'ADMIN', 'general'),
        ('transfer', '부서 이관 안내', '다른 부서로 이관 안내', '해당 문의사항은 다른 부서에서 담당하고 있습니다. 잠시만 기다려 주시면 연결해 드리겠습니다.', 'ADMIN', 'transfer'),
        ('confirm', '확인 요청', '고객에게 확인 요청', '말씀하신 내용을 정확히 이해했습니다. 혹시 다른 추가 사항이 있으신가요?', 'ADMIN', 'general'),
        ('solution', '해결책 제시', '문제 해결책 안내', '이 문제는 다음과 같이 해결하실 수 있습니다. [구체적인 해결 방법을 여기에 입력하세요]', 'ADMIN', 'solution')
      `);

    connection.release();
  } catch (error) {
    console.error('데이터베이스 테이블 생성 실패:', error.message);
    throw error;
  }
};

module.exports = { initDatabase }; 