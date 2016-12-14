# DXTemplate JS
Js的网页模板库，Web方面的轮子之一，不足5kb,实现了 if,while,for,each,include等基本功能
，提供了一个可视化的Debug(控制台查看)。

## 可视化Debug
![Debug](test/debug.png)

## 快速使用
引用 `dxtpl.js`以后可以通过如下方式使用

1. new  
通过ID定位模板，返回渲染后结果。
```javascript
var tpl=new Template('Id',Configs).render(value);
```

2. new Temp     
直接设置模板，返回渲染后结果。
```javascript
var tpl=new Template('template code',Configs).render(value);
```

3. Configs
通过设置，返回渲染后结果。
```javascript
var tpl=new Template(Configs).compile(Id).render(values);
```

4. renderTpl
直接调用渲染函数，其中ID为模板ID，value是将用与模板的变量，
支持通过 dataset设置value(data-init)和设置模板(data-config)
```
renderTpl(Id,value);
```


## Configs
| 设置名 | 类型 | 值   |说明 |
|----------|-----|------|-----|
|cache |`bool`| `true`|DOM缓存，默认开启，将编译后的模板储存在DOM树中。|
| tagstart |`string` |`'{'`  |  设置模板开始标签|
| tagend |`string`| `'}'`   | 设置模板结束标签 |
|strict| `bool`| `true`  | `Javascript`严格模式，默认开启|
| compress| `bool` |`true`  | 压缩空白HTML，默认开启|

>**Note**  可以通过Template.config(config) 设置Config

## 支持语法
### Js-if

```
{if exp}   
//...
{else if exp}
//...
{else}
...
{/if}
```

### each 
*Array*
```
{ each  obj as item}
{/each}
```
*Object*
```
{ each  obj as name:item}
{/each}
```
### Js-while
```
{while exp}
{/while}
```
### Js-For 
```
{for exp}
{/for}
```

### include
```
{include "template-id" }
```

# Lisence MIT
