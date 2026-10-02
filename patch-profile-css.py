css = '''
/* Initial circle avatar matching DramaBox Screenshot 1 */
.db-avatar-initial {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #544943;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 700;
  text-transform: lowercase;
}
'''
with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(css)
print("Added .db-avatar-initial styles ✓")
