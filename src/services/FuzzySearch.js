// Levenshtein Distance - calculates similarity between two strings
export const levenshteinDistance = (str1, str2) => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    const len1 = s1.length;
    const len2 = s2.length;

    // Create 2D array
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Fill the matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[len1][len2];
};

// Calculate similarity percentage (0-100)
export const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;

    const distance = levenshteinDistance(str1, str2);
    const maxLen = Math.max(str1.length, str2.length);

    if (maxLen === 0) return 100;

    return ((maxLen - distance) / maxLen) * 100;
};

// Fuzzy search - returns true if strings are similar enough
export const fuzzyMatch = (searchTerm, targetText, threshold = 60) => {
    if (!searchTerm || !targetText) return false;

    const search = searchTerm.toLowerCase().trim();
    const target = targetText.toLowerCase().trim();

    // Exact match (includes)
    if (target.includes(search)) return true;

    // Check if search term is very short (less than 3 chars)
    if (search.length < 3) {
        return target.includes(search);
    }

    // Word-level fuzzy matching
    const searchWords = search.split(/\s+/);
    const targetWords = target.split(/\s+/);

    for (const searchWord of searchWords) {
        for (const targetWord of targetWords) {
            const similarity = calculateSimilarity(searchWord, targetWord);
            if (similarity >= threshold) {
                return true;
            }
        }
    }

    // Full string similarity as fallback
    const fullSimilarity = calculateSimilarity(search, target);
    return fullSimilarity >= threshold;
};
