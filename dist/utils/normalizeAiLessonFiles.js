const isRecord = (value) => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};
const isValidSandpackFileValue = (value) => {
    if (typeof value === "string")
        return true;
    if (!isRecord(value))
        return false;
    return typeof value.code === "string";
};
const isValidSandpackFileEntry = (entry) => {
    const [path, value] = entry;
    const looksLikeFilePath = path.startsWith("/") &&
        /\.(tsx|ts|jsx|js|css|html|json|md)$/.test(path);
    return looksLikeFilePath && isValidSandpackFileValue(value);
};
export const normalizeSandpackFilesFromAi = (input) => {
    if (!isRecord(input))
        return undefined;
    const entries = Object.entries(input).filter(isValidSandpackFileEntry);
    if (!entries.length)
        return undefined;
    return Object.fromEntries(entries);
};
