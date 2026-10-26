# v3既有成果评估与日期审计

复核日期：2026-10-27。范围为390项既有成果记录，以及一项新增的第谷持续行星观测资料集。本审计不改动任何原始成果源文件；`event-assessments.json` 是明确的评估覆盖层，`events-historical-foundations.json` 补入缺失的观测资料集。后续的 `editorial-event-patches.json` 可细化此前10项未定年记录，而不重复建项。

## 评估规则

- 评分使用固定的编辑档位1、2、4、8、16，评价物理成果、观测基础或方法，不以声望、名气、作者数或论文篇数计分。390项记录分别有明确的双语评估，保留评价路径、把握程度与版本；原有具体成果理由充分时继续保留，新增档位评估单独记录。
- 档位含义：1为范围明确的推进，2为重要改进，4为领域内重大进展，8为关键定律、决定性证据或新方向，16为基础框架变革。这些是复核判断，不是出版机构提供的评分。
- 历史路径（1600年以前）在当时背景下评价系统定量知识、观测与仪器，不要求现代期刊论文；经典路径（1600—1899年）评价定律、实证检验及实验／数学方法；现代路径（1900年起）评价可区分的原创成果与决定性检验，论文数量不使同一成果倍增。这些路径描述证据评价方式，不是自动年代加分。
- 5项16分成果分别为牛顿统一力学、麦克斯韦电磁统一、狭义相对论、广义相对论及矩阵量子力学。波动力学作为独立且广泛有用的表述获8分，不为同一量子框架重复给出最高分。
- 哥白尼的8分对应运动地球的数学重组，不对应每个圆轨道细节。开普勒前两定律合计8分，第三定律4分。第谷经校准的行星观测资料集另有一份总计8分的预算；他对新星和彗星的结论是不同成果。
- 希格斯机制（1964）与希格斯玻色子发现（2012）分别获8分，使用不同问题族标识。理论家的生卒年与诺贝尔奖年份都不能移动这些贡献；ATLAS与CMS也不会使实验发现评分翻倍。
- 原有 `indexEligible:false` 的历史主张继续排除，其非零评估档位只是元信息，不进入物理成果总分。思想或方法贡献必须另行具名并单独评估。
- 沿用既有已复核论文、机构记录及期刊精选，根据题名、具体理由、归属与日期说明评估整组记录。本审计不声称重新阅读全文中的全部390篇原始论文；新增核对的年代来源明确附在相应覆盖记录中。

## 日期规则与实质修正

日期区分成果实际完成／观测时间及其公布、发表时间。无法可靠确定更早完成时间时，`first-public-record` 是明确的回退依据，不表示工作首次在该年完成。日期不确定性与重要性相互独立；每项覆盖记录带有 `dateConfidence`，取值为 `documented`、`approximate-source`、`estimated` 或 `undated`，而 `assessment.confidence` 指重要性判断的把握程度。编辑区间不是来源报告的置信区间。

| 记录 | 原指数日期 | v3指数分配 | 报告元信息／理由 |
|---|---:|---|---|
| 第谷新星 | 1573 | 1572年观测 | 1573年著作保留为出版元信息 |
| 第谷彗星 | 1588 | 1577年观测 | 1588年著作保留为出版元信息 |
| 第谷行星观测资料集 | 缺失 | 一份总计8分的预算，分配至1576—1597年 | 汶岛核心阶段；原始观测日志覆盖其1563—1601年更长的研究生涯 |
| 哥白尼日心体系提案 | 1543 | 编辑估计的1502—1514年理论形成区间 | Commentariolus至迟于1514年已有记录，完整De revolutionibus于1543年出版 |
| 开普勒前两定律 | 1609 | 编辑日期区间1602—1609年 | 1609年公开著作；避免虚构两项共同的确切发现日期 |
| 开普勒第三定律 | 1619 | 1618年完成 | 1618年5月15日确认有独立依据；1619年出版 |
| 牛顿框架 | 1687 | 1687年首次公开记录 | 完整公开体系，不是此前全部见解的日期 |
| 格里马尔迪衍射 | 1665 | 编辑估计的1650—1663年形成区间 | 1665年为身后出版，作者于1663年逝世 |
| 夫琅禾费光谱 | 1817 | 1814年观测／图谱 | 保留1817年论文 |
| 银河射电辐射 | 1933 | 1932年辨识 | 保留1931年信号与1933年公开报告 |
| 宇称不守恒 | 1956—1957 | 1956年提议及12月实验 | 保留1957年最终检验／发表 |
| 首次直接引力波探测 | 2016 | 2015年观测 | GW150914，2015年9月14日；保留2016年公布／论文 |
| 希格斯理论／实验 | 1964 / 2012 | 1964 / 2012 | 保留相互独立且年代正确的成果 |

复合成果族只有一份总评分，分配到有据的阶段。份额是编辑判断，不是对个人研究贡献的测量：

- `nuclear-fission`：75%分配到1938年实验发现，25%分配到1939年基本解释；两者共同构成一个8分成果族，不在每年分别记8分。
- `renormalized-qed`：重整化QED在1946—1949年的多个理论及统一工作中形成，将一份评估预算分配到形成时期。
- `density-functional-theory`：一份成果族预算的一半分配到1964年Hohenberg–Kohn基础，另一半分配到1965年Kohn–Sham构造。
- `bkt-transition`：一个拓扑相变成果族分阶段分配，40%给Berezinskii的1970年工作，60%给Kosterlitz–Thouless的1973年工作，不给中间年份虚构事件。
- `bell-inequality-experiments`：一份验证成果族预算的一半给1972年Freedman–Clauser实验，另一半给1982年Aspect实验，不在中间年份虚构逐年实验。
- `cosmic-inflation`：将Starobinsky 1980年、Guth 1981年及1982年新暴胀视为一个模型族，编辑份额为30%、40%、30%，不是论文层面测得的量。
- `efficient-blue-led`：一份技术成果族预算分配到1989年p型GaN（40%）及1993年高亮度器件（60%），不把每个工程年份都当成同等突破。
- `neutrino-flavour-oscillations`：50%给1998年大气中微子振荡，2001年和2002年太阳中微子味转换各25%，发现成果族共用一份总评分。

早期近似日期以有界的编辑不确定区间代替貌似确切的时间点，不把区间内任一年宣称为已知完成年份。10项完全未定年的记录有意留给协调后的编辑事件补丁，而不是在两个覆盖层中独立作出不一致估计。

## 关键年代新增核对来源

- [皇家丹麦图书馆：行星观测原始手稿](https://permalink.kb.dk/permalink/2006/manus/742/)——原始日志日期及1563—1601年总体跨度。
- [哥本哈根大学Niels Bohr Institute：汶岛1576—1597年](https://nbi.ku.dk/english/www/tycho/brahe/the_life)——仅用于有据的观测时期，不引入该页无关的过时生平主张。
- [Rice University Galileo Project：第谷](https://galileo.library.rice.edu/sci/brahe.html)——新星／彗星年代、精度、校准及开普勒对资料集的使用。
- [巴伐利亚科学院：行星定律及原始表述](https://kepler.badw.de/en/on-johannes-kepler/the-planetary-laws.html)——开普勒的数学内容及1609／1619年出版记录。
- [NASA APOD：第三定律于1618年发现](https://science.nasa.gov/image-article/apod-2018-may-15-keplers-house-in-linz/)——区分完成日期与出版日期。
- [斯图加特大学：开普勒历史展览文集](https://www.project.uni-stuttgart.de/kepler2022/dokumente/Kepler-Begleitband_screen-Version.pdf)——引用开普勒本人记录的1618年5月15日发现日期；可访问搜索索引摘要，但网页文本提取器无法读取32 MB完整文集，因此只作补充，不声称已通读。
- [Smithsonian Libraries：Harmonices mundi原本](https://doi.org/10.5479/sil.135810.39088002800316)——1619年原始出版。
- [不来梅大学：开普勒生平书目](https://www.presseforschung.uni-bremen.de/dokuwiki/doku.php?id=kepler_johannes)——前两定律的形成阶段。
- [美国国会图书馆：Sidereus nuncius原本](https://www.loc.gov/item/2010667904/)及[牛津大学：观测年代](https://www.cabinet.ox.ac.uk/node/6002)——望远镜观测与1610年出版。
- [库仑1785年原始论文的学术影印本](https://webusers.imj-prg.fr/~david.aubin/cours/Textes/Coulomb.pdf)——平方反比测量。
- [Fraunhofer Society](https://www.fraunhofer.de/en/about-fraunhofer/profile-structure/chronicles/joseph-von-fraunhofer.html)及[Deutsches Museum](https://www.deutsches-museum.de/en/museumsinsel/ausstellung/academy-collection)——1814年光谱观测／图谱。
- [Max Planck Institute for Radio Astronomy](https://www.mpifr-bonn.mpg.de/582352/einfuehrung)及[NRAO档案](https://www.nrao.edu/archives/jansky-finding-aid)——Jansky的观测与发表年代。
- [NIST：The Fall of Parity](https://www.nist.gov/pml/fall-parity)及[APS：1956年12月27日](https://www.aps.org/apsnews/2001/12/fall-parity-conservation-1956)——1956年12月的决定性结果。
- [LIGO合作组：GW150914](https://ligo.org/detections/gw150914/)及[2016年2月原始新闻稿](https://www.ligo.caltech.edu/system/media_files/binaries/302/original/detection-press-release.pdf)——2015年9月探测。

## 覆盖与复核台账

- 已评估的既有成果：390项；评分改变234项，不变156项。
- 档位数量：`{1: 20, 2: 75, 4: 222, 8: 68, 16: 5}`。
- 评估路径：`{'historical': 30, 'classical': 120, 'modern': 240}`。
- 评估档位不是旧尺度的自动翻倍。新增来源数量要求须服从证据质量，一篇原始论文也可支持4分成果，第二个网址不是重要性的独立测量。应用来源覆盖层后，所有8／16分成果仍有至少两个支持网址，但这不会使编辑判断变成客观量。

下表保留原成果ID及 `dateModel` 相关代码枚举标识，便于逐项对照源数据；`excluded` 表示排除计分。

| 既有成果 | 原评分 → v3评分 | v3日期模型 |
|---|---:|---|
| `early-democritus-atomism` | 2 → 2 | first-public-record; uncertain-range; -500–-401; excluded |
| `early-euclid-geometric-optics` | 2 → 4 | editorial-interval; uncertain-range; -325–-275 |
| `early-archimedes-hydrostatics` | 2 → 8 | editorial-interval; uncertain-range; -260–-230 |
| `early-hipparchus-star-catalogue` | 2 → 4 | editorial-interval; uncertain-range; -150–-125 |
| `early-zhang-heng-seismoscope` | 2 → 2 | first-public-record; point; 132–132 |
| `early-ptolemy-almagest` | 2 → 2 | editorial-interval; uncertain-range; 127–151; excluded |
| `early-aryabhatiya` | 2 → 2 | first-public-record; point; 499–499 |
| `early-philoponus-physics-commentary` | 2 → 2 | first-public-record; point; 517–517 |
| `early-brahmasphutasiddhanta` | 1 → 1 | first-public-record; point; 628–628 |
| `early-ibn-sahl-refraction` | 2 → 4 | editorial-interval; uncertain-range; 980–990 |
| `early-haytham-book-optics` | 4 → 8 | first-public-record; uncertain-range; 1011–1021 |
| `early-shen-kuo-magnetic-declination` | 2 → 2 | first-public-record; uncertain-range; 1088–1095 |
| `early-roger-bacon-perspectiva` | 1 → 1 | first-public-record; point; 1267–1267 |
| `early-tartaglia-ballistics` | 2 → 2 | first-public-record; point; 1537–1537 |
| `early-copernicus-revolutions` | 4 → 8 | editorial-interval; uncertain-range; 1502–1514 |
| `early-benedetti-motion` | 1 → 1 | first-public-record; point; 1554–1554 |
| `early-brahe-new-star` | 2 → 4 | observation; point; 1572–1572 |
| `early-stevin-hydrostatics` | 2 → 4 | first-public-record; point; 1586–1586 |
| `early-stevin-statics` | 2 → 4 | first-public-record; point; 1586–1586 |
| `early-brahe-comet-distance` | 2 → 4 | observation; point; 1577–1577 |
| `early-gilbert-magnet` | 2 → 4 | first-public-record; point; 1600–1600 |
| `early-kepler-retinal-image` | 2 → 4 | first-public-record; point; 1604–1604 |
| `early-kepler-planetary-laws` | 4 → 8 | editorial-interval; uncertain-range; 1602–1609 |
| `early-galileo-star-messenger` | 2 → 8 | observation; point; 1610–1610 |
| `early-kepler-dioptrice` | 2 → 4 | first-public-record; point; 1611–1611 |
| `early-snell-triangulation` | 2 → 2 | first-public-record; point; 1617–1617 |
| `early-kepler-third-law` | 2 → 4 | achieved; point; 1618–1618 |
| `early-castelli-flow` | 2 → 2 | first-public-record; point; 1628–1628 |
| `early-mersenne-acoustics` | 2 → 2 | first-public-record; point; 1636–1636 |
| `early-descartes-refraction` | 2 → 2 | first-public-record; point; 1637–1637 |
| `early-galileo-two-sciences` | 4 → 8 | first-public-record; point; 1638–1638 |
| `early-torricelli-efflux` | 2 → 2 | first-public-record; point; 1644–1644 |
| `early-torricelli-vacuum` | 2 → 4 | first-public-record; point; 1644–1644 |
| `early-pascal-atmospheric-pressure` | 2 → 4 | first-public-record; point; 1648–1648 |
| `early-boyle-air-pump-experiments` | 2 → 2 | first-public-record; point; 1660–1660 |
| `early-boyle-pressure-volume` | 2 → 4 | first-public-record; point; 1662–1662 |
| `early-fermat-least-time` | 2 → 4 | first-public-record; point; 1662–1662 |
| `early-grimaldi-diffraction` | 2 → 4 | editorial-interval; uncertain-range; 1650–1663 |
| `early-newton-colour` | 4 → 4 | first-public-record; point; 1672–1672 |
| `early-huygens-pendulum-theory` | 2 → 4 | first-public-record; point; 1673–1673 |
| `early-romer-light-delay` | 2 → 4 | first-public-record; point; 1676–1676 |
| `early-hooke-elasticity` | 2 → 4 | first-public-record; point; 1678–1678 |
| `early-huygens-wave-optics` | 2 → 8 | first-public-record; point; 1678–1678 |
| `early-leibniz-calculus` | 2 → 4 | first-public-record; point; 1684–1684 |
| `early-newton-principia` | 8 → 16 | first-public-record; point; 1687–1687 |
| `early-papin-piston-steam` | 2 → 2 | first-public-record; point; 1690–1690 |
| `early-halley-comet-prediction` | 2 → 2 | first-public-record; point; 1705–1705 |
| `early-hauksbee-discharge` | 2 → 2 | first-public-record; point; 1709–1709 |
| `early-newcomen-engine` | 2 → 2 | first-public-record; point; 1712–1712 |
| `early-fahrenheit-scale` | 1 → 1 | first-public-record; point; 1724–1724 |
| `early-bradley-aberration` | 2 → 2 | first-public-record; point; 1729–1729 |
| `early-gray-conduction` | 2 → 2 | first-public-record; point; 1731–1731 |
| `early-dufay-two-electricities` | 2 → 2 | first-public-record; point; 1733–1733 |
| `early-euler-mechanica` | 2 → 4 | first-public-record; point; 1736–1736 |
| `early-bernoulli-hydrodynamica` | 2 → 4 | first-public-record; point; 1738–1738 |
| `early-bernoulli-kinetic-gases` | 2 → 4 | first-public-record; point; 1738–1738 |
| `early-chatelet-physics` | 1 → 1 | first-public-record; point; 1740–1740 |
| `early-celsius-scale` | 1 → 1 | first-public-record; point; 1742–1742 |
| `early-robins-ballistic-pendulum` | 2 → 2 | first-public-record; point; 1742–1742 |
| `early-clairaut-earth-figure` | 2 → 2 | first-public-record; point; 1743–1743 |
| `early-dalembert-principle` | 2 → 4 | first-public-record; point; 1743–1743 |
| `early-dalembert-wave-equation` | 2 → 4 | first-public-record; point; 1747–1747 |
| `early-franklin-electric-theory` | 2 → 4 | first-public-record; point; 1751–1751 |
| `early-euler-fluid-equations` | 4 → 4 | first-public-record; point; 1757–1757 |
| `early-boscovich-force-theory` | 2 → 2 | first-public-record; point; 1758–1758; excluded |
| `early-aepinus-electricity` | 2 → 2 | first-public-record; point; 1759–1759 |
| `early-lambert-photometry` | 2 → 4 | first-public-record; point; 1760–1760 |
| `early-black-latent-heat` | 2 → 4 | first-public-record; point; 1762–1762 |
| `early-euler-rigid-body` | 2 → 4 | first-public-record; point; 1765–1765 |
| `early-watt-separate-condenser` | 2 → 4 | first-public-record; point; 1769–1769 |
| `early-atwood-machine` | 1 → 1 | first-public-record; point; 1780–1780 |
| `early-lavoisier-laplace-calorimetry` | 2 → 4 | first-public-record; point; 1780–1780 |
| `early-herschel-uranus` | 2 → 2 | first-public-record; point; 1781–1781 |
| `early-carnot-machines` | 1 → 1 | first-public-record; point; 1783–1783 |
| `early-coulomb-law` | 2 → 8 | first-public-record; point; 1785–1785 |
| `early-caroline-herschel-comet` | 1 → 1 | first-public-record; point; 1786–1786 |
| `early-chladni-nodal-figures` | 2 → 2 | first-public-record; point; 1787–1787 |
| `early-lagrange-analytical-mechanics` | 4 → 8 | first-public-record; point; 1788–1788 |
| `early-galvani-animal-electricity` | 2 → 2 | first-public-record; point; 1789–1789 |
| `early-caroline-star-catalogue` | 1 → 1 | first-public-record; point; 1798–1798 |
| `early-cavendish-earth-density` | 2 → 4 | first-public-record; point; 1798–1798 |
| `early-rumford-friction-heat` | 2 → 4 | first-public-record; point; 1798–1798 |
| `early-herschel-infrared` | 2 → 4 | first-public-record; point; 1800–1800 |
| `early-volta-pile` | 4 → 8 | first-public-record; point; 1800–1800 |
| `early-archimedes-statics` | 2 → 4 | pending coordinated editorial interval |
| `early-aristarchus-heliocentrism` | 2 → 2 | pending coordinated editorial interval; excluded |
| `early-biruni-earth-measurement` | 2 → 2 | pending coordinated editorial interval |
| `early-buridan-impetus` | 1 → 1 | pending coordinated editorial interval; excluded |
| `early-farisi-rainbow` | 2 → 4 | pending coordinated editorial interval |
| `early-hero-pneumatics` | 1 → 1 | pending coordinated editorial interval |
| `early-hipparchus-precession` | 2 → 4 | pending coordinated editorial interval |
| `early-mohist-optics` | 2 → 2 | pending coordinated editorial interval |
| `early-oresme-motion-diagrams` | 2 → 2 | pending coordinated editorial interval |
| `early-theodoric-rainbow` | 2 → 4 | pending coordinated editorial interval |
| `ritter-ultraviolet` | 2 → 4 | first-public-record; point; 1801–1801 |
| `young-interference` | 4 → 8 | first-public-record; point; 1801–1801 |
| `dalton-atomic-theory` | 4 → 4 | first-public-record; point; 1803–1803 |
| `malus-polarization` | 2 → 4 | first-public-record; point; 1808–1808 |
| `gauss-observational-errors` | 2 → 2 | first-public-record; point; 1809–1809 |
| `avogadro-molecular-hypothesis` | 2 → 4 | first-public-record; point; 1811–1811 |
| `fraunhofer-spectral-lines` | 2 → 4 | observation; point; 1814–1814 |
| `dulong-petit-heat-capacity` | 2 → 2 | first-public-record; point; 1819–1819 |
| `oersted-electromagnetism` | 4 → 8 | first-public-record; point; 1820–1820 |
| `faraday-electromagnetic-rotation` | 2 → 2 | first-public-record; point; 1821–1821 |
| `seebeck-thermoelectricity` | 2 → 4 | first-public-record; point; 1821–1821 |
| `fourier-heat-theory` | 4 → 8 | first-public-record; point; 1822–1822 |
| `carnot-heat-engine` | 4 → 8 | first-public-record; point; 1824–1824 |
| `ohm-circuit-law` | 4 → 4 | first-public-record; point; 1827–1827 |
| `green-potential-theory` | 4 → 4 | first-public-record; point; 1828–1828 |
| `faraday-induction` | 4 → 8 | first-public-record; point; 1831–1831 |
| `clapeyron-heat-cycle` | 2 → 2 | first-public-record; point; 1834–1834 |
| `hamilton-dynamics` | 4 → 8 | first-public-record; point; 1834–1834 |
| `coriolis-relative-motion` | 2 → 2 | first-public-record; point; 1835–1835 |
| `doppler-frequency-shift` | 2 → 4 | first-public-record; point; 1842–1842 |
| `mayer-energy-equivalence` | 2 → 4 | first-public-record; point; 1842–1842 |
| `faraday-magneto-optics` | 2 → 4 | first-public-record; point; 1845–1845 |
| `stokes-viscous-flow` | 4 → 4 | first-public-record; point; 1845–1845 |
| `helmholtz-energy-conservation` | 8 → 8 | first-public-record; point; 1847–1847 |
| `kelvin-absolute-scale` | 2 → 4 | first-public-record; point; 1848–1848 |
| `clausius-heat-work` | 4 → 8 | first-public-record; point; 1850–1850 |
| `joule-heat-equivalent` | 2 → 4 | first-public-record; point; 1850–1850 |
| `foucault-pendulum` | 2 → 4 | first-public-record; point; 1851–1851 |
| `stokes-drag-law` | 2 → 2 | first-public-record; point; 1851–1851 |
| `foote-gas-heating` | 1 → 1 | first-public-record; point; 1856–1856 |
| `kirchhoff-spectral-analysis` | 4 → 4 | first-public-record; point; 1859–1859 |
| `maxwell-velocity-distribution` | 4 → 4 | first-public-record; point; 1860–1860 |
| `maxwell-electromagnetic-field` | 8 → 16 | first-public-record; point; 1864–1864 |
| `clausius-entropy` | 4 → 8 | first-public-record; point; 1865–1865 |
| `huggins-stellar-radial-velocity` | 2 → 2 | first-public-record; point; 1868–1868 |
| `rayleigh-scattering` | 2 → 2 | first-public-record; point; 1871–1871 |
| `boltzmann-transport-h-theorem` | 4 → 4 | first-public-record; point; 1872–1872 |
| `abbe-diffraction-resolution` | 2 → 4 | first-public-record; point; 1873–1873 |
| `van-der-waals-equation` | 4 → 4 | first-public-record; point; 1873–1873 |
| `gibbs-heterogeneous-equilibrium` | 4 → 8 | first-public-record; point; 1876–1876 |
| `boltzmann-statistical-entropy` | 4 → 8 | first-public-record; point; 1877–1877 |
| `hall-effect` | 2 → 2 | first-public-record; point; 1879–1879 |
| `stefan-radiation-law` | 2 → 2 | first-public-record; point; 1879–1879 |
| `curie-piezoelectricity` | 2 → 2 | first-public-record; point; 1880–1880 |
| `reynolds-flow-transition` | 2 → 2 | first-public-record; point; 1883–1883 |
| `boltzmann-radiation-derivation` | 2 → 2 | first-public-record; point; 1884–1884 |
| `poynting-energy-flow` | 2 → 4 | first-public-record; point; 1884–1884 |
| `balmer-hydrogen-spectrum` | 2 → 4 | first-public-record; point; 1885–1885 |
| `michelson-morley-experiment` | 4 → 4 | first-public-record; point; 1887–1887 |
| `hertz-electromagnetic-waves` | 4 → 8 | first-public-record; point; 1888–1888 |
| `pockels-surface-film-balance` | 2 → 2 | first-public-record; point; 1891–1891 |
| `rontgen-x-rays` | 4 → 8 | first-public-record; point; 1895–1895 |
| `becquerel-radioactivity` | 4 → 8 | first-public-record; point; 1896–1896 |
| `zeeman-splitting` | 2 → 4 | first-public-record; point; 1896–1896 |
| `thomson-electron` | 4 → 8 | first-public-record; point; 1897–1897 |
| `curies-polonium-radium` | 4 → 4 | first-public-record; point; 1898–1898 |
| `drude-electron-metals` | 2 → 2 | first-public-record; point; 1900–1900 |
| `planck-energy-quanta` | 8 → 8 | first-public-record; point; 1900–1900 |
| `gibbs-statistical-ensembles` | 4 → 4 | first-public-record; point; 1902–1902 |
| `rutherford-soddy-transmutation` | 4 → 4 | first-public-record; point; 1902–1902 |
| `prandtl-boundary-layer` | 4 → 4 | first-public-record; point; 1904–1904 |
| `einstein-brownian-motion` | 4 → 4 | first-public-record; point; 1905–1905 |
| `einstein-light-quanta` | 4 → 8 | first-public-record; point; 1905–1905 |
| `einstein-mass-energy` | 2 → 4 | first-public-record; point; 1905–1905 |
| `einstein-special-relativity` | 8 → 16 | first-public-record; point; 1905–1905 |
| `einstein-quantum-specific-heat` | 2 → 4 | first-public-record; point; 1907–1907 |
| `mie-spherical-scattering` | 2 → 2 | first-public-record; point; 1908–1908 |
| `onnes-liquid-helium` | 4 → 4 | first-public-record; point; 1908–1908 |
| `onnes-superconductivity` | 4 → 8 | first-public-record; point; 1911–1911 |
| `rutherford-nuclear-atom` | 4 → 8 | first-public-record; point; 1911–1911 |
| `wilson-cloud-tracks` | 4 → 4 | first-public-record; point; 1911–1911 |
| `debye-solid-heat` | 2 → 2 | first-public-record; point; 1912–1912 |
| `hess-cosmic-radiation` | 4 → 4 | first-public-record; point; 1912–1912 |
| `laue-crystal-diffraction` | 4 → 4 | first-public-record; point; 1912–1912 |
| `leavitt-period-luminosity` | 4 → 4 | first-public-record; point; 1912–1912 |
| `bohr-quantized-atom` | 4 → 8 | first-public-record; point; 1913–1913 |
| `millikan-precision-charge` | 2 → 4 | first-public-record; point; 1913–1913 |
| `franck-hertz-excitation` | 2 → 4 | first-public-record; point; 1914–1914 |
| `einstein-general-relativity` | 8 → 16 | first-public-record; point; 1915–1915 |
| `einstein-stimulated-emission` | 4 → 4 | first-public-record; point; 1916–1916 |
| `schwarzschild-spherical-solution` | 2 → 4 | first-public-record; point; 1916–1916 |
| `noether-symmetry-conservation` | 4 → 8 | first-public-record; point; 1918–1918 |
| `rutherford-artificial-transmutation` | 4 → 4 | first-public-record; point; 1919–1919 |
| `saha-thermal-ionization` | 4 → 4 | first-public-record; point; 1920–1920 |
| `friedmann-dynamic-cosmology` | 4 → 4 | first-public-record; point; 1922–1922 |
| `stern-gerlach-space-quantization` | 4 → 4 | first-public-record; point; 1922–1922 |
| `compton-xray-scattering` | 4 → 4 | first-public-record; point; 1923–1923 |
| `de-broglie-matter-waves` | 4 → 4 | first-public-record; point; 1923–1923 |
| `bose-einstein-statistics` | 4 → 8 | first-public-record; point; 1924–1924 |
| `matrix-quantum-mechanics` | 8 → 16 | first-public-record; point; 1925–1925 |
| `pauli-exclusion` | 4 → 8 | first-public-record; point; 1925–1925 |
| `payne-stellar-composition` | 4 → 4 | first-public-record; point; 1925–1925 |
| `born-probability-interpretation` | 4 → 8 | first-public-record; point; 1926–1926 |
| `fermi-dirac-statistics` | 4 → 8 | first-public-record; point; 1926–1926 |
| `schrodinger-wave-mechanics` | 8 → 8 | first-public-record; point; 1926–1926 |
| `davisson-germer-diffraction` | 4 → 4 | first-public-record; point; 1927–1927 |
| `heisenberg-uncertainty` | 4 → 8 | first-public-record; point; 1927–1927 |
| `lemaitre-expanding-universe` | 4 → 4 | first-public-record; point; 1927–1927 |
| `dirac-relativistic-electron` | 4 → 8 | first-public-record; point; 1928–1928 |
| `raman-inelastic-light-scattering` | 4 → 4 | first-public-record; point; 1928–1928 |
| `hubble-distance-redshift` | 4 → 8 | first-public-record; point; 1929–1929 |
| `pauli-neutrino-hypothesis` | 2 → 4 | first-public-record; point; 1930–1930 |
| `chandrasekhar-white-dwarf-limit` | 2 → 4 | first-public-record; point; 1931–1931 |
| `cyclotron-first-demonstration` | 2 → 4 | first-public-record; point; 1931–1931 |
| `electron-microscope` | 2 → 4 | first-public-record; point; 1931–1931 |
| `onsager-reciprocity` | 2 → 4 | first-public-record; point; 1931–1931 |
| `accelerator-nuclear-transmutation` | 2 → 4 | first-public-record; point; 1932–1932 |
| `neutron-discovery` | 4 → 8 | first-public-record; point; 1932–1932 |
| `positron-discovery` | 4 → 8 | first-public-record; point; 1932–1932 |
| `coma-dark-matter` | 2 → 4 | first-public-record; point; 1933–1933 |
| `galactic-radio-emission` | 2 → 4 | observation; point; 1932–1932 |
| `meissner-effect` | 2 → 4 | first-public-record; point; 1933–1933 |
| `artificial-radioactivity` | 2 → 4 | first-public-record; point; 1934–1934 |
| `cherenkov-radiation` | 2 → 2 | first-public-record; point; 1934–1934 |
| `fermi-beta-decay-theory` | 4 → 4 | first-public-record; point; 1934–1934 |
| `slow-neutron-activation` | 2 → 2 | first-public-record; point; 1934–1934 |
| `epr-entanglement` | 2 → 2 | first-public-record; point; 1935–1935 |
| `yukawa-meson-theory` | 2 → 4 | first-public-record; point; 1935–1935 |
| `muon-discovery` | 2 → 4 | first-public-record; point; 1937–1937 |
| `helium-four-superfluidity` | 4 → 8 | first-public-record; point; 1938–1938 |
| `molecular-beam-magnetic-resonance` | 2 → 4 | first-public-record; point; 1938–1938 |
| `nuclear-fission` | 4 → 8 | achieved; sustained; 1938–1939 |
| `gravitational-collapse-model` | 2 → 4 | first-public-record; point; 1939–1939 |
| `stellar-energy-fusion` | 2 → 4 | first-public-record; point; 1939–1939 |
| `kolmogorov-turbulence-scaling` | 2 → 4 | first-public-record; point; 1941–1941 |
| `alfven-waves` | 2 → 4 | first-public-record; point; 1942–1942 |
| `controlled-nuclear-chain-reaction` | 2 → 4 | first-public-record; point; 1942–1942 |
| `onsager-exact-ising-solution` | 2 → 4 | first-public-record; point; 1944–1944 |
| `bulk-nuclear-magnetic-resonance` | 4 → 4 | first-public-record; point; 1946–1946 |
| `renormalized-qed` | 8 → 8 | achieved; sustained; 1946–1949 |
| `electron-anomalous-moment` | 2 → 4 | first-public-record; point; 1947–1947 |
| `lamb-shift` | 2 → 4 | first-public-record; point; 1947–1947 |
| `pion-discovery` | 2 → 4 | first-public-record; point; 1947–1947 |
| `point-contact-transistor` | 4 → 8 | first-public-record; point; 1947–1947 |
| `casimir-vacuum-force` | 2 → 4 | first-public-record; point; 1948–1948 |
| `holography-principle` | 2 → 4 | first-public-record; point; 1948–1948 |
| `relic-radiation-prediction` | 2 → 2 | first-public-record; point; 1948–1948 |
| `nuclear-shell-model` | 4 → 4 | first-public-record; point; 1949–1949 |
| `ginzburg-landau-theory` | 2 → 4 | first-public-record; point; 1950–1950 |
| `spin-echo` | 2 → 4 | first-public-record; point; 1950–1950 |
| `bubble-chamber` | 2 → 2 | first-public-record; point; 1952–1952 |
| `metropolis-sampling` | 2 → 4 | first-public-record; point; 1953–1953 |
| `maser` | 2 → 4 | first-public-record; point; 1954–1954 |
| `yang-mills-gauge-theory` | 8 → 8 | first-public-record; point; 1954–1954 |
| `antiproton-discovery` | 2 → 4 | first-public-record; point; 1955–1955 |
| `free-neutrino-detection` | 2 → 4 | first-public-record; point; 1956–1956 |
| `weak-parity-violation` | 4 → 8 | achieved; point; 1956–1956 |
| `abrikosov-vortex-lattice` | 2 → 4 | first-public-record; point; 1957–1957 |
| `bcs-superconductivity` | 4 → 8 | first-public-record; point; 1957–1957 |
| `stellar-nucleosynthesis-synthesis` | 2 → 4 | first-public-record; point; 1957–1957 |
| `anderson-localization` | 2 → 4 | first-public-record; point; 1958–1958 |
| `mossbauer-effect` | 2 → 4 | first-public-record; point; 1958–1958 |
| `semiconductor-tunnel-diode` | 2 → 2 | first-public-record; point; 1958–1958 |
| `aharonov-bohm-effect` | 2 → 4 | first-public-record; point; 1959–1959 |
| `ruby-laser` | 4 → 4 | first-public-record; point; 1960–1960 |
| `landauer-erasure-bound` | 2 → 4 | first-public-record; point; 1961–1961 |
| `josephson-effect` | 2 → 4 | first-public-record; point; 1962–1962 |
| `muon-neutrino-discovery` | 2 → 4 | first-public-record; point; 1962–1962 |
| `hubbard-correlated-electrons` | 2 → 4 | first-public-record; point; 1963–1963 |
| `kerr-black-hole` | 2 → 4 | first-public-record; point; 1963–1963 |
| `lorenz-deterministic-chaos` | 2 → 4 | first-public-record; point; 1963–1963 |
| `quantum-optical-coherence` | 2 → 4 | first-public-record; point; 1963–1963 |
| `quasar-redshift` | 2 → 4 | first-public-record; point; 1963–1963 |
| `bell-theorem` | 4 → 4 | first-public-record; point; 1964–1964 |
| `cp-violation-kaons` | 4 → 4 | first-public-record; point; 1964–1964 |
| `density-functional-theory` | 4 → 8 | achieved; sustained; 1964–1965 |
| `higgs-mechanism` | 4 → 8 | achieved; point; 1964–1964 |
| `quark-model` | 4 → 8 | first-public-record; point; 1964–1964 |
| `cosmic-microwave-background` | 4 → 8 | first-public-record; point; 1965–1965 |
| `penrose-singularity-theorem` | 2 → 4 | first-public-record; point; 1965–1965 |
| `low-loss-fibre-proposal` | 2 → 4 | first-public-record; point; 1966–1966 |
| `electroweak-unification` | 8 → 8 | first-public-record; point; 1967–1967 |
| `pulsar-discovery` | 2 → 4 | first-public-record; point; 1967–1967 |
| `radiative-convective-climate-model` | 2 → 4 | first-public-record; point; 1967–1967 |
| `deep-inelastic-scattering` | 4 → 4 | first-public-record; point; 1968–1968 |
| `multiwire-proportional-chamber` | 2 → 4 | first-public-record; point; 1968–1968 |
| `solar-neutrino-problem` | 2 → 4 | first-public-record; point; 1968–1968 |
| `charge-coupled-device` | 2 → 4 | first-public-record; point; 1969–1969 |
| `bkt-transition` | 4 → 4 | achieved; sustained; 1970–1973 |
| `gim-mechanism` | 2 → 4 | first-public-record; point; 1970–1970 |
| `gauge-theory-renormalizability` | 2 → 4 | first-public-record; point; 1971–1971 |
| `wilson-renormalization-group` | 4 → 8 | first-public-record; point; 1971–1971 |
| `bell-inequality-experiments` | 4 → 4 | achieved; sustained; 1972–1982 |
| `helium-three-superfluidity` | 2 → 4 | first-public-record; point; 1972–1972 |
| `black-hole-entropy` | 2 → 4 | first-public-record; point; 1973–1973 |
| `kobayashi-maskawa-cp-model` | 2 → 4 | first-public-record; point; 1973–1973 |
| `magnetic-resonance-imaging` | 2 → 4 | first-public-record; point; 1973–1973 |
| `qcd-asymptotic-freedom` | 8 → 8 | first-public-record; point; 1973–1973 |
| `weak-neutral-currents` | 2 → 4 | first-public-record; point; 1973–1973 |
| `binary-pulsar-discovery` | 2 → 4 | first-public-record; point; 1974–1974 |
| `hawking-radiation` | 4 → 4 | first-public-record; point; 1974–1974 |
| `jpsi-charmonium-discovery` | 4 → 8 | first-public-record; point; 1974–1974 |
| `tau-lepton-discovery` | 2 → 4 | first-public-record; point; 1975–1975 |
| `bottom-quark-discovery` | 2 → 4 | first-public-record; point; 1977–1977 |
| `laser-cooling-trapped-ions` | 2 → 4 | first-public-record; point; 1978–1978 |
| `gluon-three-jet-evidence` | 2 → 4 | first-public-record; point; 1979–1979 |
| `parisi-spin-glass-order` | 2 → 4 | first-public-record; point; 1979–1979 |
| `cosmic-inflation` | 4 → 4 | achieved; sustained; 1980–1982 |
| `integer-quantum-hall-effect` | 4 → 8 | first-public-record; point; 1980–1980 |
| `scanning-tunnelling-microscope` | 2 → 4 | first-public-record; point; 1981–1981 |
| `fractional-quantum-hall-effect` | 4 → 8 | first-public-record; point; 1982–1982 |
| `w-z-boson-discovery` | 4 → 4 | first-public-record; point; 1983–1983 |
| `bb84-quantum-key-distribution` | 2 → 4 | first-public-record; point; 1984–1984 |
| `berry-geometric-phase` | 2 → 4 | first-public-record; point; 1984–1984 |
| `chirped-pulse-amplification` | 2 → 4 | first-public-record; point; 1985–1985 |
| `macroscopic-quantum-circuit` | 2 → 4 | first-public-record; point; 1985–1985 |
| `optical-molasses-neutral-atoms` | 2 → 4 | first-public-record; point; 1985–1985 |
| `universal-quantum-computer` | 2 → 4 | first-public-record; point; 1985–1985 |
| `atomic-force-microscope` | 2 → 4 | first-public-record; point; 1986–1986 |
| `cuprate-high-temperature-superconductivity` | 4 → 8 | first-public-record; point; 1986–1986 |
| `supernova-neutrinos` | 2 → 4 | first-public-record; point; 1987–1987 |
| `giant-magnetoresistance` | 2 → 4 | first-public-record; point; 1988–1988 |
| `efficient-blue-led` | 2 → 4 | achieved; sustained; 1989–1993 |
| `cobe-blackbody-spectrum` | 2 → 4 | first-public-record; point; 1990–1990 |
| `cobe-cmb-anisotropies` | 4 → 4 | first-public-record; point; 1992–1992 |
| `quantum-teleportation-protocol` | 2 → 4 | first-public-record; point; 1993–1993 |
| `shor-algorithm` | 2 → 4 | first-public-record; point; 1994–1994 |
| `dilute-gas-bose-einstein-condensation` | 4 → 8 | first-public-record; point; 1995–1995 |
| `exoplanet-solar-type-star` | 2 → 4 | first-public-record; point; 1995–1995 |
| `quantum-error-correction` | 2 → 4 | first-public-record; point; 1995–1995 |
| `top-quark-discovery` | 2 → 4 | first-public-record; point; 1995–1995 |
| `trapped-ion-quantum-gate` | 2 → 4 | first-public-record; point; 1995–1995 |
| `ads-cft-correspondence` | 4 → 4 | first-public-record; point; 1997–1997 |
| `experimental-quantum-teleportation` | 2 → 4 | first-public-record; point; 1997–1997 |
| `accelerating-universe` | 4 → 8 | first-public-record; point; 1998–1998 |
| `neutrino-flavour-oscillations` | 4 → 8 | achieved; sustained; 1998–2002 |
| `slow-light-ultracold-gas` | 1 → 1 | first-public-record; point; 1999–1999 |
| `tau-neutrino-discovery` | 1 → 1 | first-public-record; point; 2000–2000 |
| `attosecond-light-pulses` | 2 → 4 | first-public-record; point; 2001–2001 |
| `ultracold-mott-transition` | 2 → 4 | first-public-record; point; 2002–2002 |
| `fermionic-pair-condensation` | 2 → 4 | first-public-record; point; 2004–2004 |
| `graphene-isolation` | 4 → 4 | first-public-record; point; 2004–2004 |
| `numerical-black-hole-merger` | 2 → 4 | first-public-record; point; 2005–2005 |
| `strongly-coupled-quark-gluon-plasma` | 2 → 4 | first-public-record; point; 2005–2005 |
| `quantum-spin-hall-insulator` | 2 → 4 | first-public-record; point; 2007–2007 |
| `higgs-boson-discovery` | 4 → 8 | observation; point; 2012–2012 |
| `icecube-astrophysical-neutrinos` | 2 → 4 | first-public-record; point; 2013–2013 |
| `loophole-free-bell-tests` | 2 → 4 | first-public-record; point; 2015–2015 |
| `weyl-semimetal-discovery` | 2 → 4 | first-public-record; point; 2015–2015 |
| `direct-gravitational-wave-detection` | 4 → 8 | observation; point; 2015–2015 |
| `binary-neutron-star-multimessenger` | 2 → 4 | first-public-record; point; 2017–2017 |
| `magic-angle-twisted-graphene` | 2 → 4 | first-public-record; point; 2018–2018 |
| `event-horizon-telescope-m87` | 4 → 4 | first-public-record; point; 2019–2019 |
| `solar-cno-neutrinos` | 1 → 1 | first-public-record; point; 2020–2020 |
| `fusion-target-ignition` | 2 → 4 | first-public-record; point; 2022–2022 |
| `nanohertz-gravitational-wave-evidence` | 2 → 4 | first-public-record; point; 2023–2023 |
| `below-threshold-quantum-error-correction` | 1 → 1 | first-public-record; point; 2024–2024 |
| `baryon-cp-violation` | 1 → 1 | first-public-record; point; 2025–2025 |
| `journal-electron-spin` | 4 → 8 | first-public-record; point; 1925–1925 |
| `journal-quantum-ferromagnetism` | 4 → 4 | first-public-record; point; 1928–1928 |
| `journal-deuterium` | 2 → 2 | first-public-record; point; 1932–1932 |
| `journal-fission-liquid-drop` | 2 → 2 | first-public-record; point; 1939–1939 |
| `journal-neutrino-helicity` | 2 → 4 | first-public-record; point; 1958–1958 |
| `journal-hubbard-auxiliary-field` | 2 → 2 | first-public-record; point; 1959–1959 |
| `journal-neutron-phonon-spectra` | 2 → 4 | first-public-record; point; 1959–1959 |
| `journal-nambu-spontaneous-symmetry-breaking` | 4 → 8 | first-public-record; point; 1960–1960 |
| `journal-pound-rebka-redshift` | 2 → 4 | first-public-record; point; 1960–1960 |
| `journal-eightfold-way` | 4 → 4 | first-public-record; point; 1961–1961 |
| `journal-optical-second-harmonic` | 2 → 4 | first-public-record; point; 1961–1961 |
| `journal-extrasolar-xrays` | 4 → 4 | first-public-record; point; 1962–1962 |
| `journal-cabibbo-mixing` | 2 → 4 | first-public-record; point; 1963–1963 |
| `journal-kondo-resistance` | 2 → 4 | first-public-record; point; 1964–1964 |
| `journal-soliton-recurrence` | 2 → 2 | first-public-record; point; 1965–1965 |
| `journal-mermin-wagner` | 2 → 4 | first-public-record; point; 1966–1966 |
| `journal-veneziano-amplitude` | 2 → 2 | first-public-record; point; 1968–1968 |
| `journal-environment-decoherence` | 2 → 2 | first-public-record; point; 1970–1970 |
| `journal-helium-three-pairing-theory` | 2 → 4 | first-public-record; point; 1972–1972 |
| `journal-wess-zumino-supersymmetry` | 2 → 2 | first-public-record; point; 1974–1974 |
| `journal-supergravity` | 2 → 2 | first-public-record; point; 1976–1976 |
| `journal-altarelli-parisi-evolution` | 2 → 4 | first-public-record; point; 1977–1977 |
| `journal-hexatic-melting` | 2 → 2 | first-public-record; point; 1978–1978 |
| `journal-pointer-basis` | 2 → 2 | first-public-record; point; 1981–1981 |
| `journal-tknn-topological-conductance` | 4 → 8 | first-public-record; point; 1982–1982 |
| `journal-haldane-spin-chain` | 4 → 4 | first-public-record; point; 1983–1983 |
| `journal-laughlin-fractional-fluid` | 4 → 8 | first-public-record; point; 1983–1983 |
| `journal-lattice-gas-fluids` | 2 → 2 | first-public-record; point; 1986–1986 |
| `journal-optical-tweezers` | 2 → 4 | first-public-record; point; 1986–1986 |
| `journal-single-ion-quantum-jumps` | 2 → 4 | first-public-record; point; 1986–1986 |
| `journal-haldane-chern-insulator` | 4 → 4 | first-public-record; point; 1988–1988 |
| `journal-control-chaos` | 2 → 2 | first-public-record; point; 1990–1990 |
| `journal-synchronize-chaos` | 2 → 2 | first-public-record; point; 1990–1990 |
| `journal-ekert-entanglement-cryptography` | 2 → 2 | first-public-record; point; 1991–1991 |
| `journal-dmrg` | 2 → 4 | first-public-record; point; 1992–1992 |
| `journal-light-orbital-angular-momentum` | 2 → 2 | first-public-record; point; 1992–1992 |
| `journal-strong-field-harmonic-theory` | 2 → 2 | first-public-record; point; 1994–1994 |
| `journal-cavity-field-decoherence` | 2 → 2 | first-public-record; point; 1996–1996 |
| `journal-spin-magnetization-tunnelling` | 2 → 2 | first-public-record; point; 1996–1996 |
| `journal-jarzynski-equality` | 2 → 4 | first-public-record; point; 1997–1997 |
| `journal-warped-extra-dimension` | 2 → 2 | first-public-record; point; 1999–1999 |
| `journal-negative-index-medium` | 2 → 4 | first-public-record; point; 2000–2000 |
| `journal-optical-frequency-comb` | 4 → 4 | first-public-record; point; 2000–2000 |
| `journal-perfect-lens-proposal` | 2 → 2 | first-public-record; point; 2000–2000 |
| `journal-arbitrary-degree-random-graphs` | 2 → 2 | first-public-record; point; 2001–2001 |
| `journal-entanglement-negativity` | 1 → 1 | first-public-record; point; 2002–2002 |
| `journal-element-118-confirmation` | 1 → 1 | first-public-record; point; 2006–2006 |
| `journal-three-dimensional-topological-insulator` | 2 → 4 | first-public-record; point; 2007–2007 |

## 身后出版的边界检查

程序将原始记录加第谷资料集共391项成果的日期模型，与全部关联档案中的逝世年份作比较；发现只有格里马尔迪的一项日期模型完全位于关联贡献者逝世之后。现将1665年身后出版另存元信息，实质成果采用明确标注的1650—1663年编辑形成区间。博洛尼亚大学博物馆明确说明该著作在作者去世后出版；该区间是估计，不是有据的逐年观测序列。当前300项新增编辑记录也通过了单年／区间、未来日期和生平边界检查。

- [博洛尼亚大学博物馆：格里马尔迪与衍射](https://sma.unibo.it/it/qr-code/righi-e-linsegnamento-della-fisica/esperimento-grimaldi)
- [博洛尼亚大学：格里马尔迪](https://www.scienzagiovane.unibo.it/English/scientists/grimaldi-1.html)

## 哥白尼早期提案与1543年完整著作的区别

同一8分事件现明确对应**运动地球的日心行星体系早期提案**，而不是将第一版印刷本作为出版史事件。此定义遵循所要求的实际成果年代：Commentariolus在De revolutionibus出版前已包含重排行星次序的体系，不为后来的完整著作再记第二份8分。

Owen Gingerich的IAU历史综述（Harvard–Smithsonian，Cambridge出版）解释，无名草稿至迟已见于Matthew of Miechów的1514年私人藏书目录。圣保罗大学对原始文献注释译本的书目描述将其形成时间置于约1510年。由此采用的保守1502—1514年分配是实用的**编辑日期估计**，并不表示各年都有确证的工作，也不是来源置信区间；约1510年是常见估年，不是确知下界。`dateConfidence` 保持 `estimated`，有据的流传上界与1543年完整著作出版分别保存为元信息。

定年仍有争议。布里斯托大学的历史分析区分了传统宽泛文献界限（1502年之后、1514年5月之前）与约1510年的情境重建。较新的文体计量研究提出更早形成的可能性，包括1503年夏季假说；这是保守1502—1514年区间容纳的另一种历史重建，本项目并未将其采用为确切日期。未来史学更新可以扩展或移动该事件的日期分布，而不增加重复理论事件。只有把事件严格限定为完整出版的数学著作时，保留1543年才合适，但那不能表示本指数要求纳入的、实质上更早的提案。

- [Gingerich历史综述：The Astronomy and Cosmology of Copernicus](https://resolve.cambridge.org/core/services/aop-cambridge-core/content/view/92CFF685FEA0F86E3AF3DA1415D2195D/S1539299600001830a.pdf/astronomy_and_cosmology_of_copernicus.pdf)
- [圣保罗大学：Commentariolus注释译本](https://www.ghtc.usp.br/ram-r37.htm)
- [布里斯托大学：Copernicus’s Development in Context](https://research-information.bris.ac.uk/files/52397418/Copernicus_s_development_in_context_v20.pdf)
- [Borski与Kokowski：2025年文体计量定年假说](https://academic.oup.com/dsh/article/40/1/15/7933816)
