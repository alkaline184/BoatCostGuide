import { registerHooks } from "node:module";
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error.code !== "ERR_MODULE_NOT_FOUND" ||
        !specifier.startsWith(".") ||
        !context.parentURL?.startsWith("file:") ||
        !new URL(specifier, context.parentURL).href.startsWith(
          new URL("../../", import.meta.url).href,
        )
      )
        throw error;
      return nextResolve(specifier + ".ts", context);
    }
  },
});
