import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal JSON encoder/decoder for the pub/sub demo.
 *
 * <p>Published messages and received payloads are always small maps of
 * scalar values plus the occasional nested map/list, so a hand-rolled
 * encoder is sufficient. Avoids pulling in a JSON library for what is
 * otherwise a self-contained demo.</p>
 */
final class JsonUtil {

    private JsonUtil() {
    }

    /** Serialise a value to a JSON string. */
    static String toJson(Object value) {
        StringBuilder builder = new StringBuilder();
        writeValue(builder, value);
        return builder.toString();
    }

    /** Parse a JSON value that is expected to be an object (map). */
    @SuppressWarnings("unchecked")
    static Map<String, Object> parseObject(String text) {
        if (text == null || text.isBlank()) {
            return new LinkedHashMap<>();
        }
        Object parsed = parseAny(text);
        if (parsed instanceof Map<?, ?>) {
            return (Map<String, Object>) parsed;
        }
        return new LinkedHashMap<>();
    }

    /** Parse any JSON value. */
    static Object parseAny(String text) {
        Parser parser = new Parser(text);
        parser.skipWhitespace();
        Object value = parser.readValue();
        parser.skipWhitespace();
        return value;
    }

    private static void writeValue(StringBuilder builder, Object value) {
        if (value == null) {
            builder.append("null");
        } else if (value instanceof String) {
            writeString(builder, (String) value);
        } else if (value instanceof Number || value instanceof Boolean) {
            builder.append(value.toString());
        } else if (value instanceof Map<?, ?>) {
            writeMap(builder, (Map<?, ?>) value);
        } else if (value instanceof Iterable<?>) {
            writeList(builder, (Iterable<?>) value);
        } else {
            writeString(builder, value.toString());
        }
    }

    private static void writeString(StringBuilder builder, String value) {
        builder.append('"');
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"': builder.append("\\\""); break;
                case '\\': builder.append("\\\\"); break;
                case '\b': builder.append("\\b"); break;
                case '\f': builder.append("\\f"); break;
                case '\n': builder.append("\\n"); break;
                case '\r': builder.append("\\r"); break;
                case '\t': builder.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        builder.append(String.format("\\u%04x", (int) c));
                    } else {
                        builder.append(c);
                    }
            }
        }
        builder.append('"');
    }

    private static void writeMap(StringBuilder builder, Map<?, ?> map) {
        builder.append('{');
        boolean first = true;
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            if (!first) {
                builder.append(',');
            }
            writeString(builder, String.valueOf(entry.getKey()));
            builder.append(':');
            writeValue(builder, entry.getValue());
            first = false;
        }
        builder.append('}');
    }

    private static void writeList(StringBuilder builder, Iterable<?> list) {
        builder.append('[');
        boolean first = true;
        for (Object item : list) {
            if (!first) {
                builder.append(',');
            }
            writeValue(builder, item);
            first = false;
        }
        builder.append(']');
    }

    private static final class Parser {
        private final String src;
        private int pos;

        Parser(String src) {
            this.src = src;
            this.pos = 0;
        }

        void skipWhitespace() {
            while (pos < src.length() && Character.isWhitespace(src.charAt(pos))) {
                pos++;
            }
        }

        Object readValue() {
            skipWhitespace();
            if (pos >= src.length()) {
                throw new IllegalArgumentException("Unexpected end of JSON");
            }
            char c = src.charAt(pos);
            if (c == '{') {
                return readObject();
            }
            if (c == '[') {
                return readArray();
            }
            if (c == '"') {
                return readString();
            }
            if (c == 't' || c == 'f') {
                return readBoolean();
            }
            if (c == 'n') {
                return readNull();
            }
            return readNumber();
        }

        Map<String, Object> readObject() {
            Map<String, Object> map = new LinkedHashMap<>();
            pos++; // skip '{'
            skipWhitespace();
            if (pos < src.length() && src.charAt(pos) == '}') {
                pos++;
                return map;
            }
            while (pos < src.length()) {
                skipWhitespace();
                String key = readString();
                skipWhitespace();
                if (pos >= src.length() || src.charAt(pos) != ':') {
                    throw new IllegalArgumentException("Expected ':' in JSON object at pos " + pos);
                }
                pos++;
                Object value = readValue();
                map.put(key, value);
                skipWhitespace();
                if (pos < src.length() && src.charAt(pos) == ',') {
                    pos++;
                    continue;
                }
                if (pos < src.length() && src.charAt(pos) == '}') {
                    pos++;
                    return map;
                }
                throw new IllegalArgumentException("Expected ',' or '}' in JSON object at pos " + pos);
            }
            throw new IllegalArgumentException("Unterminated JSON object");
        }

        List<Object> readArray() {
            List<Object> list = new ArrayList<>();
            pos++; // skip '['
            skipWhitespace();
            if (pos < src.length() && src.charAt(pos) == ']') {
                pos++;
                return list;
            }
            while (pos < src.length()) {
                Object value = readValue();
                list.add(value);
                skipWhitespace();
                if (pos < src.length() && src.charAt(pos) == ',') {
                    pos++;
                    continue;
                }
                if (pos < src.length() && src.charAt(pos) == ']') {
                    pos++;
                    return list;
                }
                throw new IllegalArgumentException("Expected ',' or ']' in JSON array at pos " + pos);
            }
            throw new IllegalArgumentException("Unterminated JSON array");
        }

        String readString() {
            if (pos >= src.length() || src.charAt(pos) != '"') {
                throw new IllegalArgumentException("Expected '\"' at pos " + pos);
            }
            pos++;
            StringBuilder builder = new StringBuilder();
            while (pos < src.length()) {
                char c = src.charAt(pos++);
                if (c == '"') {
                    return builder.toString();
                }
                if (c == '\\') {
                    if (pos >= src.length()) {
                        throw new IllegalArgumentException("Bad escape at end of string");
                    }
                    char esc = src.charAt(pos++);
                    switch (esc) {
                        case '"': builder.append('"'); break;
                        case '\\': builder.append('\\'); break;
                        case '/': builder.append('/'); break;
                        case 'b': builder.append('\b'); break;
                        case 'f': builder.append('\f'); break;
                        case 'n': builder.append('\n'); break;
                        case 'r': builder.append('\r'); break;
                        case 't': builder.append('\t'); break;
                        case 'u':
                            if (pos + 4 > src.length()) {
                                throw new IllegalArgumentException("Bad unicode escape");
                            }
                            int code = Integer.parseInt(src.substring(pos, pos + 4), 16);
                            builder.append((char) code);
                            pos += 4;
                            break;
                        default:
                            throw new IllegalArgumentException("Bad escape: \\" + esc);
                    }
                } else {
                    builder.append(c);
                }
            }
            throw new IllegalArgumentException("Unterminated string");
        }

        Boolean readBoolean() {
            if (src.startsWith("true", pos)) {
                pos += 4;
                return Boolean.TRUE;
            }
            if (src.startsWith("false", pos)) {
                pos += 5;
                return Boolean.FALSE;
            }
            throw new IllegalArgumentException("Expected boolean at pos " + pos);
        }

        Object readNull() {
            if (src.startsWith("null", pos)) {
                pos += 4;
                return null;
            }
            throw new IllegalArgumentException("Expected null at pos " + pos);
        }

        Number readNumber() {
            int start = pos;
            if (pos < src.length() && (src.charAt(pos) == '-' || src.charAt(pos) == '+')) {
                pos++;
            }
            boolean isFloat = false;
            while (pos < src.length()) {
                char c = src.charAt(pos);
                if (Character.isDigit(c)) {
                    pos++;
                } else if (c == '.' || c == 'e' || c == 'E' || c == '-' || c == '+') {
                    isFloat = true;
                    pos++;
                } else {
                    break;
                }
            }
            String num = src.substring(start, pos);
            if (isFloat) {
                return Double.parseDouble(num);
            }
            try {
                return Long.parseLong(num);
            } catch (NumberFormatException e) {
                return Double.parseDouble(num);
            }
        }
    }
}
