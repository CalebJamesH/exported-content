# Export

Export web content articles from Liferay (Customer Portal) and save them as JSON files.

## API

Use the Liferay headless delivery API.

- Base URL: `https://support.liferay.com`
- Site ID: `2013383`

**List articles in a folder:**
This is going to be the main API used
```
GET /o/headless-delivery/v1.0/structured-content-folders/{folderId}/structured-contents?flatten={true|false}&page=1&pageSize=100
```

**Get full article details:**
```
GET /o/headless-delivery/v1.0/structured-contents/{id}
```

## Folders

**Full export** — grab everything:

| Section | Folder ID(s) | Flatten |
|---|---|---|
| Announcements | `26095490` | true |
| Getting Started | `27408738` | true |
| Compatibility Matrix | `27461466` | true |
| Before Opening | `27494992` | false |
| LES | `27495252` | false |
| Security Alerts | `27461452` | false |
| Release Notes | `27495011`, `27495008`, `26936458` | false |

**Partial export** — dont' grab all articles, only grab articles that match a URL list:

| Section | Folder ID(s) | Count | Flatten |
|---|---|---|---|
| DXP Activation | `27408742` | 7 of 16 | false |
| Administration | `27408740` | 1 of 2 | false |
| Overview | `27408744` | 1 of 5 | false |
| Team Members | `27408946` | 1 of 9 | false |
| Patching and Release | `27494982` | 6 of 9 | false | 
| Support FAQ | `27494989` | 2 of 11 | false |
| Security | `27111977` | 1 of 2 | false |

For partial export, pull all articles from the folder, then keep only ones whose `friendlyUrlPath` is in our URL list. Source of truth for the list will be is this [document](https://docs.google.com/spreadsheets/d/1iu9UYUeBUe7Ru6gvtZan8stwkeCARN0T_lYhNBukDv4/edit?pli=1&gid=0#gid=0)

## Languages

Articles can be in `en-US`, `es-ES`, `ja-JP`, or `pt-BR`. Each article's `availableLanguages` field tells you which ones it has.

You have to fetch the whole folder once for each language. Pass the language in the `Accept-Language` header:

```
GET /o/headless-delivery/v1.0/structured-content-folders/{folderId}/structured-contents?flatten={true|false}
Accept-Language: es-ES
```

Steps:
1. Fetch the folder with `Accept-Language: en-US` to get the full list of articles
2. Re-fetch the folder for each other language
3. Match articles across languages by `id` or `friendlyUrlPath`

## Output

Save one JSON file per article per language:

```
/output/{FolderName}/{lang}/ArticleTitle.json (e.g: output/AnalyticsCloud/en-US/AnalyticsCloud.json)
```

Save the raw API response as-is. No transformations.