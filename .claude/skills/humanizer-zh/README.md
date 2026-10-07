# 这个目录是搬进来的第三方 skill

**不是本仓库原创的。** 这一份是从上游原样拷过来的快照，用来做全站去 AI 味。

| | |
|---|---|
| 上游 | https://github.com/op7418/Humanizer-zh |
| 作者 | 歸藏 |
| 许可 | MIT，版权归原作者（见同目录的 `LICENSE`，**不要删**） |
| 快照日期 | 2026-09-14（本机 `~/.agents/skills/humanizer-zh/` 那份的文件改动时间） |
| 拷了什么 | 只有 `SKILL.md` 和 `LICENSE` 两个文件，逐字未改 |

## 为什么搬进来

放在 `~/.claude/skills/` 下只有本机能用，别人 clone 这个仓库拿不到。
搬到仓库的 `.claude/skills/` 下就是项目级 skill，用 Claude Code 打开这个仓库时自动可见。
本机原来那份不动，两边各留一份。

## 怎么更新

```bash
cp ~/.agents/skills/humanizer-zh/SKILL.md .claude/skills/humanizer-zh/SKILL.md
cp ~/.agents/skills/humanizer-zh/LICENSE  .claude/skills/humanizer-zh/LICENSE
git add .claude/skills/humanizer-zh && git commit -m "更新 humanizer-zh 快照"
```

上游是另一个仓库，不会自动同步。**搬运是单向的**：这个仓库里改了它，下次覆盖就丢。
本仓库自己的去 AI 味规矩写在仓库根的 `CLAUDE.md`，不写在这里。

## 本项目对它的两处例外

上游的规则不能整套照用，有两处本仓库要豁免，理由写在 `CLAUDE.md` 的「去 AI 味」一节：

- **「删除金句」**不适用于避坑清单。那 5 条按格式就该是可截图收藏的短句，数量也定死 5 条。
- **「两项优于三项」**同上，和避坑清单的 5 条要求冲突。

去 AI 味只在分析段落和说明文字上做。

## 用它的地方

- 仓库根的 `CLAUDE.md`，「去 AI 味（对照 humanizer-zh）」一节
- `.claude/skills/company-failure-longform/SKILL.md`，「去 AI 味」一节