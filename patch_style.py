import re

with open('games/durak/style.css', 'r') as f:
    css = f.read()

# 1. Update seat count base
css = re.sub(r'(\.seat-count \{.*?min-width: )22px(.*?height: )22px(.*?font-size: )0\.72rem(.*?line-height: )22px(.*?border-radius: )11px', 
             r'\g<1>26px\g<2>26px\g<3>0.85rem\g<4>26px\g<5>13px', css, flags=re.DOTALL)

# 2. Update deck count base
css = re.sub(r'(#deck-count, #discard-count \{.*?min-width: )22px(.*?height: )22px(.*?font-size: )0\.72rem(.*?line-height: )22px(.*?border-radius: )11px', 
             r'\g<1>26px\g<2>26px\g<3>0.85rem\g<4>26px\g<5>13px', css, flags=re.DOTALL)

# 3. Update deck-zone, trump-slot, discard-zone bases
css = re.sub(r'(#deck-zone \{\s*position: absolute;\s*top: 6px;\s*left: 6px;\s*width: )36px(;\s*height: )50px(;)', 
             r'\g<1>46px\g<2>64px\g<3>', css)
css = re.sub(r'(#deck-zone \.card-btn,\s*#discard-zone \.card-btn \{\s*width: )36px(;\s*height: )50px(;)', 
             r'\g<1>46px\g<2>64px\g<3>', css)
css = re.sub(r'(#discard-zone \{\s*position: absolute;\s*top: 6px;\s*right: 6px;\s*left: auto;\s*width: )36px(;\s*height: )50px(;)', 
             r'\g<1>46px\g<2>64px\g<3>', css)
css = re.sub(r'(#trump-slot \{\s*position: absolute;\s*top: 6px;\s*left: )29px(;\s*width: )36px(;\s*height: )50px(;)', 
             r'\g<1>33px\g<2>46px\g<3>64px\g<4>', css)

# 4. Update field base
css = css.replace('padding: 6px 52px 20px 52px;', 'padding: 6px 44px 20px 44px;')
css = css.replace('.field-pair > * + * { margin-top: -38px; }', '.field-pair + .field-pair { margin-left: -20px; }\n.field-pair > * + * { margin-top: -54px; }')

# 5. Update hand-row base
css = css.replace('--hand-card-w: 68px;', '--hand-card-w: 84px;')
css = css.replace('.hand-row > * + * { margin-left: calc(var(--hand-card-w) * -0.55); }', '.hand-row > * + * { margin-left: calc(var(--hand-card-w) * -0.45); }')

# 6. Update card-btn bases
css = css.replace('  width: 68px;\n  height: 95px;', '  width: 84px;\n  height: 118px;')
css = css.replace('.card-btn.field-card { cursor: default; opacity: 0.95; width: 56px; height: 78px; }', '.card-btn.field-card { cursor: default; opacity: 0.95; width: 76px; height: 106px; }')
css = css.replace('.card-placeholder {\n  width: 56px;\n  height: 78px;', '.card-placeholder {\n  width: 76px;\n  height: 106px;')

# 7. Update < 380px block
c380 = """@media (max-width: 380px) {
  .card-btn { width: 74px; height: 104px; }
  .card-btn.field-card { width: 64px; height: 90px; }
  .card-placeholder { width: 64px; height: 90px; }
  .hand-row { --hand-card-w: 74px; }
  .hand-row > * + * { margin-left: calc(var(--hand-card-w) * -0.45); }
  .action-btn { padding: 8px 14px; font-size: 0.9rem; min-width: 64px; }
  .seat-tile .seat-card { width: 44px; height: 62px; }
  .seat-count { min-width: 22px; height: 22px; font-size: 0.72rem; line-height: 22px; top: -5px; right: -5px; }
  .seat-name { font-size: 0.62rem; }
  .seat-role { font-size: 0.54rem; padding: 1px 4px; }
  #opponents { gap: 4px; padding: 6px 6px 3px; }
  .count-btn { min-width: 36px; padding: 6px 0; font-size: 0.82rem; }
  .mode-btn { padding: 6px 12px; font-size: 0.82rem; }
  #deck-zone { width: 40px; height: 56px; top: 6px; left: 6px; }
  #trump-slot { width: 40px; height: 56px; top: 6px; left: 28px; transform: rotate(90deg); }
  #discard-zone { top: 6px; right: 6px; left: auto; width: 40px; height: 56px; }
  #deck-zone .card-btn, #discard-zone .card-btn { width: 40px; height: 56px; }
  #field { padding: 6px 40px 20px 40px; }
  .field-pair + .field-pair { margin-left: -18px; }
  .field-pair > * + * { margin-top: -45px; }
  .action-prompt { font-size: 0.82rem; padding: 6px 12px; top: 8px; max-width: calc(100% - 100px); }
  #deck-count, #discard-count { min-width: 22px; height: 22px; font-size: 0.72rem; line-height: 22px; }
}"""
old_380 = css[css.find('@media (max-width: 380px) {'):]
old_380 = old_380[:old_380.find('}')+1]
css = css.replace(old_380, c380)

# 8. Update >= 500px block
c500 = """@media (min-width: 500px) {
  .card-btn { width: 94px; height: 132px; }
  .card-btn.field-card { width: 84px; height: 118px; }
  .card-placeholder { width: 84px; height: 118px; }
  .hand-row { --hand-card-w: 94px; }
  .hand-row > * + * { margin-left: calc(var(--hand-card-w) * -0.45); }
  .seat-tile .seat-card { width: 56px; height: 78px; }
  #deck-zone { width: 56px; height: 78px; top: 12px; left: 12px; }
  #trump-slot { width: 56px; height: 78px; top: 12px; left: 40px; transform: rotate(90deg); }
  #discard-zone { top: 12px; right: 12px; left: auto; width: 56px; height: 78px; }
  #deck-zone .card-btn, #discard-zone .card-btn { width: 56px; height: 78px; }
  #field { padding: 6px 64px 20px 64px; }
  .field-pair + .field-pair { margin-left: -22px; }
  .field-pair > * + * { margin-top: -60px; }
  .action-prompt { font-size: 1.1rem; padding: 10px 22px; top: 14px; }
  .seat-count, #deck-count, #discard-count { min-width: 28px; height: 28px; font-size: 0.9rem; line-height: 28px; border-radius: 14px; }
}"""
old_500 = css[css.find('@media (min-width: 500px) {'):]
old_500 = old_500[:old_500.find('}')+1]
css = css.replace(old_500, c500)

# 9. Update >= 768px block
c768 = """@media (min-width: 768px) {
  .card-btn { width: 106px; height: 148px; border-radius: 8px; }
  .card-btn.field-card { width: 94px; height: 132px; }
  .card-placeholder { width: 94px; height: 132px; }
  .hand-row { --hand-card-w: 106px; }
  .hand-row > * + * { margin-left: calc(var(--hand-card-w) * -0.45); }
  .action-btn { padding: 10px 28px; font-size: 1.2rem; }
  .seat-tile .seat-card { width: 62px; height: 87px; }
  #deck-zone { width: 62px; height: 87px; top: 14px; left: 14px; }
  #trump-slot { width: 62px; height: 87px; top: 14px; left: 45px; transform: rotate(90deg); }
  #discard-zone { top: 14px; right: 14px; left: auto; width: 62px; height: 87px; }
  #deck-zone .card-btn, #discard-zone .card-btn { width: 62px; height: 87px; }
  #field { padding: 6px 74px 20px 74px; }
  .field-pair + .field-pair { margin-left: -24px; }
  .field-pair > * + * { margin-top: -66px; }
  .seat-count, #deck-count, #discard-count { min-width: 32px; height: 32px; font-size: 1.05rem; line-height: 32px; border-radius: 16px; top: -8px; right: -8px; }
}"""
old_768 = css[css.find('@media (min-width: 768px) {'):]
old_768 = old_768[:old_768.find('}')+1]
css = css.replace(old_768, c768)

with open('games/durak/style.css', 'w') as f:
    f.write(css)
