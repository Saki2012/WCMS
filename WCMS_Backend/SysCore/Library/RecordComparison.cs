namespace WCMS.SysCore.Library
{
    public enum RecordCompareType
    {
        BothExist,   // 左右兩邊都有這個 key
        LeftOnly,    // 只有左邊有
        RightOnly    // 只有右邊有
    }

    public sealed class RecordCompareResult<TLeft, TRight, TKey>(TKey key, IReadOnlyList<TLeft> leftItems, IReadOnlyList<TRight> rightItems, RecordCompareType type)
    {
        public TKey Key { get; } = key;
        public IReadOnlyList<TLeft> LeftItems { get; } = leftItems;
        public IReadOnlyList<TRight> RightItems { get; } = rightItems;
        public RecordCompareType Type { get; } = type;
    }

    public static class RecordComparison
    {
        #region Public
        /// <summary>
        /// 兩個來源依 key 比對。
        /// 會在內部先依 key 排序（使用 Comparer&lt;TKey&gt;.Default 或你傳入的 comparer），
        /// 然後用 merge-join 方式一次掃過。
        /// 
        /// TKey 可以是單一欄位，也可以是 ValueTuple 做複合 key：
        ///   h => (h.Year, h.Month, h.Day)
        /// </summary>
        public static IEnumerable<RecordCompareResult<TLeft, TRight, TKey>> CompareByKey<TLeft, TRight, TKey>(IEnumerable<TLeft> leftSource,IEnumerable<TRight> rightSource,Func<TLeft, TKey> leftKeySelector,Func<TRight, TKey> rightKeySelector,IComparer<TKey>? comparer = null)
        {
            ArgumentNullException.ThrowIfNull(leftSource);
            ArgumentNullException.ThrowIfNull(rightSource);
            ArgumentNullException.ThrowIfNull(leftKeySelector);
            ArgumentNullException.ThrowIfNull(rightKeySelector);
            comparer ??= Comparer<TKey>.Default;
            // 在這裡依 key 排序（內部自己處理，不用呼叫端先排）
            var left = leftSource.OrderBy(leftKeySelector, comparer).ToList();
            var right = rightSource.OrderBy(rightKeySelector, comparer).ToList();
            // 呼叫核心 merge-join
            return CompareByKeyCore(left, right, leftKeySelector, rightKeySelector, comparer);
        }
        #endregion

        #region Private
        /// <summary>
        /// 內部核心：假設 left / right 已經依 key 排好序，做 merge-join。
        /// </summary>
        private static IEnumerable<RecordCompareResult<TLeft, TRight, TKey>> CompareByKeyCore<TLeft, TRight, TKey>(IList<TLeft> left,IList<TRight> right,Func<TLeft, TKey> leftKeySelector,Func<TRight, TKey> rightKeySelector,IComparer<TKey> comparer)
        {
            int i = 0; // 左表 index
            int j = 0; // 右表 index
            while (i < left.Count || j < right.Count)
            {
                if (i >= left.Count)
                {
                    // 左邊用完 → 右邊剩下都是 RightOnly
                    var rightKey = rightKeySelector(right[j]);
                    var rightGroup = CollectSameKey(right, j, rightKeySelector, rightKey, comparer, out j);
                    yield return new RecordCompareResult<TLeft, TRight, TKey>(rightKey,[],rightGroup,RecordCompareType.RightOnly);
                    continue;
                }
                if (j >= right.Count)
                {
                    // 右邊用完 → 左邊剩下都是 LeftOnly
                    var leftKey = leftKeySelector(left[i]);
                    var leftGroup = CollectSameKey(left, i, leftKeySelector, leftKey, comparer, out i);
                    yield return new RecordCompareResult<TLeft, TRight, TKey>(leftKey,leftGroup, [], RecordCompareType.LeftOnly);
                    continue;
                }
                var kLeft = leftKeySelector(left[i]);
                var kRight = rightKeySelector(right[j]);
                int cmp = comparer.Compare(kLeft, kRight);
                if (cmp < 0)
                {
                    // 左 key 比右 key 小 → 只在左邊
                    var leftGroup = CollectSameKey(left, i, leftKeySelector, kLeft, comparer, out i);
                    yield return new RecordCompareResult<TLeft, TRight, TKey>(kLeft,leftGroup,[],RecordCompareType.LeftOnly);
                }
                else if (cmp > 0)
                {
                    // 右 key 比左 key 小 → 只在右邊
                    var rightGroup = CollectSameKey(right, j, rightKeySelector, kRight, comparer, out j);
                    yield return new RecordCompareResult<TLeft, TRight, TKey>(kRight, [], rightGroup,RecordCompareType.RightOnly);
                }
                else
                {
                    // key 相同 → 左右都有（1 對 1 / 1 對多 / 多對多 都在這裡處理）
                    var leftGroup = CollectSameKey(left, i, leftKeySelector, kLeft, comparer, out i);
                    var rightGroup = CollectSameKey(right, j, rightKeySelector, kRight, comparer, out j);
                    yield return new RecordCompareResult<TLeft, TRight, TKey>(kLeft,leftGroup,rightGroup,RecordCompareType.BothExist);
                }
            }
        }
        /// <summary>
        /// 從起始 index 開始，把「連續相同 key」的元素收集起來。
        /// </summary>
        private static List<T> CollectSameKey<T, TKey>(IList<T> source,int startIndex,Func<T, TKey> keySelector,TKey key,IComparer<TKey> comparer,out int nextIndex)
        {
            var list = new List<T>();
            int idx = startIndex;
            while (idx < source.Count)
            {
                var current = source[idx];
                var currentKey = keySelector(current);
                if (comparer.Compare(key, currentKey) != 0)break;
                list.Add(current);
                idx++;
            }
            nextIndex = idx;
            return list;
        }
        #endregion
    }
}
