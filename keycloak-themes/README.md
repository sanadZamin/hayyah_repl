# Hayyah Keycloak Themes

This folder contains a ready-to-use Keycloak theme named `hayyah-default`.

## Included theme types

- `login` (includes Hayyah wordmark under `login/resources/img/`)
- `account`
- `email` (inherits from `base`)

When deploying, copy the entire `hayyah-default` folder so **`login/resources/img/`** is present; the CSS references `../img/hayyah-wordmark.png`.

## Apply in Keycloak

1. Copy `keycloak-themes/hayyah-default` into your Keycloak themes directory:
   - Container image path is typically `/opt/keycloak/themes/`
2. Restart Keycloak.
3. In Admin Console, open:
   - `Realm Settings` -> `Themes`
4. Select:
   - **Login theme:** `hayyah-default`
   - **Account theme:** `hayyah-default`
   - **Email theme:** `hayyah-default`
5. Save.

## Theme selected but login still looks default

1. Confirm `login/theme.properties` still includes the stylesheet line:

   ```
   styles=css/hayyah.css
   ```

2. After changing CSS, run **`kc.sh build`** again (Bitnami: `/opt/bitnami/keycloak/bin/kc.sh build`) and restart the container.

3. In the browser, open the **login page** (not the Admin Console) in a **private window** or hard-refresh (`Ctrl+Shift+R`). The Admin UI always uses the **Admin** theme, not the realm **Login** theme.

4. In DevTools → **Network**, filter by `hayyah` and confirm `hayyah.css` loads with **200**. If it is **404**, the file path under `login/resources/` does not match `styles=` in `theme.properties`.

5. If a duplicate realm name (“hayyah”) appears as small text on the far left, redeploy the latest `hayyah.css` (it hides Keycloak’s outer PF5 header/brand strip; you still get the wordmark inside the centered card).

## Notes

- Colors follow your CRM design system:
  - Blue `#0088FB`
  - Navy `#0D2270`
  - Mint `#53FFB0`
  - Blue light `#E8F4FF`
- If your Keycloak version uses different base templates, you can keep `theme.properties` and adjust only CSS selectors.
