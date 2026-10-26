# BESIII 内部材料

`data.js` 通过父目录 `registerInternalNoteGroup()` 独立登记BESIII及两篇材料，日期未提供，因此不显示日期。网页只展示编号、题名、作者、简介和内部PDF外链。

| 编号 | 来源与维护位置 |
|---|---|
| `bam1027` | 题名与现有arXiv:2610.11981一致，科学结果于2026-10-26核对[arXiv原记录](https://arxiv.org/abs/2610.11981)，简介按相同研究重述；内部材料作者与DocDB链接由站主提供 |
| `bam1089` | 题名、作者、完整简介及DocDB链接均由站主于2026-10-26提供；保留全部分支比、误差、显著性和质量增强结论，分成5段便于阅读 |

两篇材料均按站主指定顺序署名 `Li Yuhong, Ma Hailong, Zhao Minggang`，不是对arXiv合作组作者署名的替换。`bam1027` 对应DocDB `0016/001613/020/MEMO_final.pdf`，`bam1089` 对应 `0017/001747/005/MEMO_chicJ_SigmaXiK_v2.3.pdf`；不得互换或擅自改为其他版本。

题名保留 `title` 纯文本回退和可选 `titleTex`；简介保留 `summary[].text`，公式段另有 `summary[].tex` 使用本地KaTeX。修改资料时同时维护两种表示，不能只改可视公式而让回退保留旧数值。`J=0,1,2` 的顺序决定各组分支比顺序；第一项误差为统计，第二项为系统。

本模块没有内部PDF副本；链接在新标签页打开，合作组权限在DocDB原站执行。后续材料直接追加同组 `entries`，其他课题组另建目录。格式和校验边界见[父说明](../README.md)，兼容性证据由[专门记录](../../../../../docs/modules/academic-publications-internal-note.md)统一维护。
