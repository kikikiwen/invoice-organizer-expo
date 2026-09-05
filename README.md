# 发票整理 / Factures（Expo）

启动即相机，照片保存在 App 私有目录；可多选发票、压缩为 PDF，并通过系统分享。支持 **中文 / 法语**（随系统语言切换）。

## 项目结构

```
app/                          # 路由页面（只做组合，不含业务逻辑）
├── _layout.tsx
├── index.tsx                 # 图册主页
└── pdfs.tsx                  # PDF 列表

src/
├── components/               # 纯 UI 组件
│   ├── album/                # 图册：Header、Footer、PhotoGrid
│   ├── common/               # Loading、EmptyState
│   └── pdf/                  # PDF 列表
├── features/                 # 屏幕级逻辑（hooks）
│   ├── album/useAlbumScreen.ts
│   ├── pdf/usePdfListScreen.ts
│   ├── invoices/useInvoiceData.ts
│   └── selection/usePhotoSelection.ts
├── services/                 # 业务服务
│   ├── photoService.ts       # 保存 / 列出照片
│   ├── pdfService.ts         # 创建 / 列出 PDF
│   ├── shareService.ts       # 系统分享
│   ├── systemCameraService.ts # 系统相机拍照
│   └── imageCompression.ts   # 图片压缩
├── pdf/
│   └── buildInvoicePdf.ts    # PDF 生成（pdf-lib）
├── storage/                  # 文件系统底层
│   ├── paths.ts
│   ├── listDirectoryFiles.ts
│   ├── readFileBytes.ts
│   └── writeBinaryFile.ts
├── i18n/                     # 中法双语
├── constants/                # 常量（压缩率、PDF 尺寸）
├── types/                    # 类型定义
└── utils/                    # 工具函数（bytes、文件名、时间戳）
```

## 开发

```bash
npm install
npx expo start
```

## 构建

```bash
eas build --platform ios --profile production
eas build --platform android --profile preview
```

Bundle ID / Package: `com.kikiwen.invoiceorganizer`
