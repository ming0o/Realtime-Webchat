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
      console.log('chat_rooms 테이블에 status 컬럼이 추가되었습니다.');
    } catch (error) {
      // 컬럼이 이미 존재하는 경우 무시
      console.log('status 컬럼이 이미 존재합니다.');
    }

    // 매크로 템플릿 테이블 추가
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS macro_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        macro_type ENUM('off-hours', 'lunch-time', 'holiday') NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 기본 매크로 템플릿 데이터 삽입
    await connection.execute(`
        INSERT IGNORE INTO macro_templates (macro_type, name, description, content) VALUES
        ('off-hours', '업무외 시간 멘트', '업무시간이 아닐 때 사용하는 멘트', '지금은 업무시간이 아닙니다. 업무시간은 평일 오전 9시부터 오후 6시까지이며, 홈페이지에 방문하시면 자세한 사항을 확인하실 수 있습니다.'),
        ('lunch-time', '점심시간 멘트', '점심시간(11:30-13:00)에 사용하는 멘트', '오전 11시 30분부터 1시까지는 점심시간으로 통화 연결이 어렵습니다. 오후 1시 이후 다시 한번 연락 주시면 친절히 상담 드리겠습니다. 감사합니다.'),
        ('holiday', '휴일 멘트', '주말 휴일에 사용하는 멘트', '주말은 휴일입니다. 업무시간에 다시 연락 부탁드립니다. 업무시간은 평일 오전 9시부터 오후 6시까지입니다. 감사합니다.')
      `);

    connection.release();
    console.log('데이터베이스 테이블이 정상적으로 생성되었습니다.');
  } catch (error) {
    console.error('데이터베이스 테이블 생성 실패:', error.message);
    throw error;
  }
};

module.exports = { initDatabase }; 