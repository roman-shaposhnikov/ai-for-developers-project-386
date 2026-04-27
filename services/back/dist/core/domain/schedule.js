"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weekdayOfUtcDate = exports.emptyWeeklySchedule = exports.validateWeeklySchedule = exports.blockToMinutes = exports.WEEKDAYS = void 0;
const errors_1 = require("./errors");
exports.WEEKDAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
];
const TIME_RE = /^([01]\d|2[0-3]):[0-5][05]$/;
const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};
const blockToMinutes = (block) => ({
    start: toMinutes(block.start),
    end: toMinutes(block.end),
});
exports.blockToMinutes = blockToMinutes;
const validateBlock = (block, dayName) => {
    if (!TIME_RE.test(block.start) || !TIME_RE.test(block.end)) {
        throw errors_1.DomainError.validation('INVALID_TIME_BLOCK', `${dayName}: time must match HH:MM with 5-minute granularity`);
    }
    if (toMinutes(block.end) <= toMinutes(block.start)) {
        throw errors_1.DomainError.validation('INVALID_TIME_BLOCK', `${dayName}: block end must be after start`);
    }
};
const validateDay = (day, dayName) => {
    for (const block of day.blocks) {
        validateBlock(block, dayName);
    }
    const sorted = [...day.blocks]
        .map((b) => (0, exports.blockToMinutes)(b))
        .sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].start < sorted[i - 1].end) {
            throw errors_1.DomainError.validation('OVERLAPPING_BLOCKS', `${dayName}: time blocks must not overlap`);
        }
    }
};
const validateWeeklySchedule = (schedule) => {
    for (const day of exports.WEEKDAYS) {
        const ds = schedule.weekdays[day];
        if (!ds) {
            throw errors_1.DomainError.validation('MISSING_DAY', `Schedule must define every weekday (missing: ${day})`);
        }
        validateDay(ds, day);
    }
};
exports.validateWeeklySchedule = validateWeeklySchedule;
const emptyWeeklySchedule = () => ({
    weekdays: exports.WEEKDAYS.reduce((acc, day) => {
        acc[day] = { enabled: false, blocks: [] };
        return acc;
    }, {}),
});
exports.emptyWeeklySchedule = emptyWeeklySchedule;
const weekdayOfUtcDate = (year, month, day) => {
    const date = new Date(Date.UTC(year, month - 1, day));
    const map = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
    ];
    return map[date.getUTCDay()];
};
exports.weekdayOfUtcDate = weekdayOfUtcDate;
//# sourceMappingURL=schedule.js.map