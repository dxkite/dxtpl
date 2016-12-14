;
!(function (window) {

    //  缓存查找节点可能会耗时较多 
    var default_config = {
        cache: true, // 是否开启缓存
        tagstart: '{',
        tagend:'}', //控制标签
        compress: true,
        strict: true,
    };

    // 关键字
    var KEYWORD = 'if,else,each,include,while,for';
    var KEYWORD_PREG = '^\\s*((?:\/)?(?:' + KEYWORD.split(',').join('|') + '))(.*)';

    // @artTemplate:https://github.com/aui/artTemplate
    var ENGINE = ''.trim ? ["$_tpl_=''", "$_tpl_+=", ";", "$_tpl_"] : ["$_tpl_=[]", "$_tpl_.push(", ");", "$_tpl_.join('')"];

    var escape = {
        "<": "&#60;",
        ">": "&#62;",
        '"': "&#34;",
        "'": "&#39;",
        "&": "&#38;"
    };


    /*  --------------------  静态内部函数 protected ------------------------*/


    /**
     * 测试模板语句的可行性
     * 
     * @param {any} test
     * @param {any} code
     * @returns
     */
    function statmentTest(test, code) {
        try {
            new Function(test);
        } catch (e) {
            return 'throw ' + e.name + '(' + _string(e.message) + ');{';
        }
        return code;
    }


    /**
     * 处理HTML部分
     * 
     * @param {any} html
     * @param {any} compress 是否压缩
     * @returns
     */
    function parserHTML(html, compress) {
        // console.log('HTML:', html);
        var out = '';
        if (html.match(/(?!^)\n/)) {
            _each(html.split('\n'), function (html) {
                if (html) {
                    // 压缩多余空白与注释
                    if (compress) {
                        html = html.replace(/\s+/g, ' ').replace(/<!--.*?-->/g, '');
                    }
                    if (html) {
                        out += ENGINE[1] + _string(html) + ENGINE[2];
                        out += '\n';
                    }
                }
            });
        } else if (html) {
            out += ENGINE[1] + _string(html) + ENGINE[2];
        }
        return out;
    }


    /**
     * 处理代码
     * 
     * @param {any} code
     * @returns
     */
    function parserCode(code) {
        var match;
        // console.log(new RegExp(KEYWORD_PREG));
        if (match = code.match(new RegExp(KEYWORD_PREG))) {
            // console.log(code,':',match);
            var command = match[1];
            var param = match[2];

            switch (command) {
                case 'include': // 编译时包含
                    param = param.trim().split(' ');
                    if (param.length === 1) {
                        param.push("$_unit.value");
                    }
                    param = param.join(',');
                    return ENGINE[1] + '$_unit._include(' + param + ')' + ENGINE[2];
                case 'if':
                    return statmentTest('if(' + param + '){}', 'if (' + param + ') {');
                case 'else':
                    // console.log(param,param.match(/^\s*if\s+(.*)/));
                    if (match = param.match(/^\s*if\s+(.*)/)) {
                        return '} else if (' + match[1] + '){';
                    }
                    return '}else{';
                case '/if':
                case '/while':
                case '/for':
                    return '}';
                case 'while':
                    return statmentTest('while(' + param + '){}', 'while (' + param + ') {');
                case 'for':
                    return statmentTest('for(' + param + '){}', 'for (' + param + ') {');
                case 'each':
                    var match = param.match(/(\w+)\s+(?:(?:as(?:\s+(\w+)))?(?:(?:\s+=>)?\s+(\w+))?)?/);
                    if (match) {
                        var value = match[1];
                        var each_param;
                        if (match[2]) {
                            if (match[3]) {
                                each_param = match[3] + ',' + match[2];
                            } else {
                                each_param = match[2];
                            }
                        } else {
                            each_param = 'value,index';
                        }
                        return '$_unit._each(' + value + ',function(' + each_param + '){';
                    }
                    return 'throw SyntaxError("Null Each Value");$_unit._each(null,function(){';
                case '/each':
                    return '});';
            }
        }
        // 非转义
        else if (match = code.match(/^!.*$/)) {
            return ENGINE[1] + '$_unit._echo(' + match[1] + ')' + ENGINE[2];
        }
        // 转义输出
        else {
            return ENGINE[1] + '$_unit._escape(' + code + ')' + ENGINE[2];
        }
    }



    var _echo = function (value) {
        return new String(value);
    }

    var _escape = function (content) {
        return _echo(content).replace(/&(?![\w#]+;)|[<>"']/g, function (s) {
            return escape[s];
        });
    };

    var _each = function (value, callback) {
        if (is_array(value)) {
            _arrayEach(value, callback);
        } else {
            for (var index in value) {
                callback.call(value[index], value[index], index);
            }
        }
    }
    var _arrayEach = function (value, callback) {
        for (var index = 0; index < value.length; ++index) {
            callback.call(value[index], value[index], index);
        }
    }
    var _objectCopy = function (arrays) {
        var object = {};
        for (var i = 0; i < arguments.length; i++) {
            for (var index in arguments[i]) {
                object[index] = arguments[i][index];
            }
        }
        return object;
    }

    var _include = function (id, value) {
        if (document.getElementById(id)) {
            try {
                var tmp = new template(id, value);
                if (tmp instanceof String) {
                    return tmp;
                }
                return '[Error Template ' + id + ']';
            } catch (e) {
                throw e;
            }
        } else
            throw Error('No Template ' + id);
    }

    /**
     * 生成可显示字符串
     * 
     * @param {any} code
     * @returns
     */
    function _string(code) {
        return "'" + code
            // 单引号与反斜杠转义
            .replace(/('|\\)/g, '\\$1')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n') + "'";
    }


    /**
     * 判断是否是数组
     * 
     * @param {any} obj
     * @returns
     */
    function is_array(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }



    /**
     * 提示代码错误
     * 
     * @param {any} name
     * @param {any} content
     * @param {any} line
     * @param {any} e
     */
    function reportError(name, content, line, e) {
        var name = name || 'anonymous';
        var report = 'DxTPL Error:';
        console.group(report);
        if (content) {

            var codes = content.replace(/^\n/, '').split('\n');
            var start = line - 5 > 0 ? line - 5 : 1;
            var end = line + 5 > codes.length ? codes.length : line + 5;
            console.error(e);
            // console.log(codes);
            for (var i = start; i < end; i++) {
                if (i == line) {
                    console.log(i + '|%c' + codes[line - 1] + '\t\t%c->\t\t%c' + e.name + ':' + e.message, 'color:red;', 'color:green;', 'color:red;');
                } else {
                    console.log(i + '|' + codes[i - 1]);
                }
            }

        } else {
            console.log(content);
            console.log('%c' + report + e.message + '\t\t@' + name + ':' + line, 'color:red;');
        }
        console.groupEnd(report);
    }



    /**
     * 编译模板
     * 
     * @param {any} text
     * @param {any} config
     * @returns
     */
    function compileTemplate(text, config) {
        var tpl = '';
        // console.log('code',text);
        text = text.replace(/^\n/, '');
        // console.log(tagstart);
        _each(text.split(config.tagstart), function (value) {
            // console.log('split',value);
            var split = value.split(config.tagend);
            if (split.length === 1) {
                tpl += parserHTML(split[0], config.compress);
            } else {
                tpl += parserCode(split[0]);
                tpl += parserHTML(split[1]);
            }
        });
        return tpl;
    }


    /**
     * 给模板压入变量
     * 
     * @param {any} source
     * @param {any} value
     * @param {any} strict
     * @returns
     */
    function linkValue(source, value, strict) {
        var use_strict = strict === undefined ?  true : strict ;
        var ext = [];
        ext.push('var $_unit=this,' + ENGINE[0]);
        for (var index in value) {
            ext.push(index + '=this.value.' + index);
        }
        var link_str = '';
        if (use_strict) {
            link_str = '"use strict";';
        }
        link_str += ext.join(',');
        link_str += ';';
        link_str += source + 'return new String(' + ENGINE[3] + ');';
        return link_str;
    }




    /**
     * 渲染模板代码
     * 
     * @param {any} name
     * @param {any} source
     * @param {any} compiled_code
     * @param {any} value
     * @returns
     */
    function render(name, source, compiled_code, value,strict) {
        // console.time('render ' + name);
        var runcode = linkValue(compiled_code, value,strict);
        // console.log(runcode);
        var caller = {
            _each: _each,
            _echo: _echo,
            _escape: _escape,
            _include: _include,
            value: value
        };

        var html;
        try {
            var render = new Function(runcode);
            html = render.call(caller);
        } catch (e) {
            // For Chrome
            var match = new String(e.stack).match(/<anonymous>:(\d+):\d+/);
            // console.log(source);
            // console.log(e);
            if (match) {
                var line = match[1] - 1;
                reportError(name, source, line, e);
            } else {
                var name = name || 'anonymous';
                // For Edge
                var match = new String(e.stack).match(/Function code:(\d+):\d+/);
                if (match) {
                    console.error('DxTPL:Compile Error@' + name + ' Line ' + match[1]);
                } else {
                    console.error('DxTPL:Compile Error@' + name);
                }
            }

        }
        // console.timeEnd('render ' + name);
        return html;
    }

    function getDOMcache(name, config) {
        // console.time('getcache:' + name);
        var cache_parent = document.getElementById('template_caches');
        if (!cache_parent) {
            cache_parent = document.createElement('div');
            cache_parent.id = 'template_caches';
            cache_parent.style.display = 'none';
            document.body.appendChild(cache_parent);
        }
        var cache_name = 'template_cache_' + name;

        var tpl_cache = document.getElementById('template_cache_' + name);
        if (!tpl_cache) {
            tpl_cache = document.createElement('div');
            tpl_cache.id = cache_name;
            tpl_cache.innerText = compileTemplate(document.getElementById(name).innerHTML, config || default_config);
            cache_parent.appendChild(tpl_cache);
        }
        // console.timeEnd('getcache:' + name);
        return tpl_cache.innerText;
    }


    /* ----  编译DOM对象 ----*/
    function compile(id, config) {
        var tplId = id || config.id;
        if (typeof tplId !== 'string') throw Error('Unsupport Template ID');
        var tpl = document.getElementById(tplId);
        // 获取源码
        config.source = tpl.innerHTML;
        if (config.code) {
            // 代码已经编译
            // console.log('code ['+id+'] already compiled');
            // console.log(config.code);
        } else if (config.cache) {
            config.code = getDOMcache(tplId, config);
        } else {
            config.code = compileTemplate(source, config);
        }
        return config;
    }

    /* -----------------  外部函数 public ---------------------------*/

    var Template = function (config) {
        // 适配对象
        var conf = _objectCopy(default_config, config);

        this.source = conf.source;
        this.code = conf.code;
        this.config(conf);
        // 设置ID自动编译
        if (conf.id) {
            var val = compile(conf.id, conf);
            this.config(val);
        }
    }


    Template.prototype.config = function (config) {
        for (var index in config) {
            this[index] = config[index];
        }
    }


    Template.prototype.assign = function (name, value) {
        this.value[name] = _objectCopy(this.value[name], value);
    }

    Template.prototype.value = function (value) {
        this.value = _objectCopy(this.value, value);
    }

    Template.prototype.compile = function (id) {
        var config = _objectCopy(this, compile(id, this));
        return new Template(config);
    }

    Template.prototype.render = function (value) {
        if (this.source && this.code) {
            return render(this.id, this.source, this.code, value,this.strict);
        } else {
            console.error('Uncompile Template');
        }
    }


    Template.template= function (selector,glovalue){
        var nodes = document.querySelectorAll(selector);
        var _self = this;
        // console.log(nodes);
        _arrayEach(nodes, function (node, index) {
            var source = node.innerHTML;
            var value;
            if (node.dataset.tplInit) {
                try {
                    var json = new Function('return ' + node.dataset.tplInit + ';');
                    value = json();
                } catch (e) {
                    reportError(selector + '[' + index + ']', null, 0, new Error('Unsupport json'));
                }
            }
            
            value = _objectCopy(value, glo_value);
            var code;
            if (!_self.template[selector]) {
                code = compileTemplate(source, _self);
                _self.template[selector] = code;
            } else {
                code = _self.template[selector];
            }

            console.log(code);
            node.innerHTML = render(selector, source, code, value);
        });
    }

    /*


        Template.prototype.compile = function (content) {
            return {
                display: function (value) {
                    return render(null, content, compileTemplate(content, parsers), value);
                }
            }
        }

        dxtpl.template = template;
        dxtpl.selftpl = selftpl;
        */
    window.dxtpl = new Template();
    window.dxtpl.Template = Template;
})(window);