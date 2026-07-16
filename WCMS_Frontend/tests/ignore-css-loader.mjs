export const load = async (url, context, nextLoad) =>
{
    if (url.endsWith("?url"))
    {
        return { format: "module", shortCircuit: true, source: `export default ${JSON.stringify(url.slice(0, -4))};` };
    }
    if (url.endsWith(".css"))
    {
        return { format: "module", shortCircuit: true, source: "export default {};" };
    }

    return nextLoad(url, context);
};
