---
title: Recipe Syntax
---

Recipes are basically [JSON](https://en.wikipedia.org/wiki/JSON) files that follow a special schema.  If you're comfortable working with standard JSON, then creating and customizing Recipes will be very easy.

One bit that is specific to SFDX-Falcon Recipes: Certain key/value pairs, like the [top-level `handlers` property](#top-level-properties) or the `skipGroups` and `skipActions` properties inside of [the `options` object](#options) are listed as "optional", but must still be present.

If you choose not to add data for these properties, that's OK.  Just make sure to add (depending on the property's type) an empty string `""`, empty array `[]`, or empty object `{}` as a value.
