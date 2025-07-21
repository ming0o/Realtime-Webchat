const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chat_room_id: {
        type: Number,
        required: true,
        index: true
    },
    sender_type: {
        type: String,
        enum: ['USER', 'ADMIN', 'BOT'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    message_type: {
        type: String,
        enum: ['TEXT', 'IMAGE', 'FILE'],
        default: 'TEXT'
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'messages'
});

// 채팅방별 메시지 조회를 위한 인덱스
messageSchema.index({ chat_room_id: 1, createdAt: -1 });

// 메시지 생성 시간을 created_at으로 매핑
messageSchema.virtual('created_at').get(function () {
    return this.createdAt;
});

messageSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        delete ret.createdAt;
        delete ret.updatedAt;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Message', messageSchema); 