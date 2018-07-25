////////////////////////////////////
/////     STYLE CONSTANTS     //////
////////////////////////////////////
const TD_CTN_STYLE = "border-bottom: 3px solid #ddd;";
const CONTENT_HEADING_CTN_STYLE = "margin: 20px; width: 80%;";
const CONTENT_TYPE_STYLE = "font-family: 'Helvetica', sans-serif; font-weight: normal; font-size: 16px; margin: 0; color: #888;";
const CONTENT_TITLE_STYLE = "font-family: 'Helvetica', sans-serif; font-weight: normal; font-size: 24px; margin: 0; margin-top: 5px; color: #333;";
const CONTENT_IMG_STYLE = "max-width: 100%;  text-align: center; margin-left: auto; margin-right: auto;";
const CONTENT_BLURB_STYLE = "margin:0;padding-top:7px;padding-bottom:7px;padding: 20px;";
const CONTENT_LINK_CTN_STYLE = "margin:0;padding-top:7px;padding-bottom:7px;;padding-left: 20px; padding-bottom: 20px; color: blue;";
const CONTENT_LINK_STYLE = "color: inherit; text-decoration: none;";

//////////////////////////////////////
/////     TEXT PLACEHOLDERS     //////
//////////////////////////////////////
const PLACEHOLDER_TYPE = "Content Type";
const PLACEHOLDER_TITLE = "Content Title";
const PLACEHOLDER_IMG = './images/placeholder.gif';
const PLACEHOLDER_BLURB = "This is the blurb";
const PLACEHOLDER_LINK = "Learn More";



/////////////////////////////
/////     UTILITIES     /////
/////////////////////////////
function generateElement(tagName, klasses, id) {
  if (!tagName) {
    return False;
  }
  var el = document.createElement(tagName);
  el.id = id;
  if (klasses) {
    for (let klass of klasses) {
      el.classList.add(klass);
    }
  }
    return el;
}


/////////////////////////////////
/////     Popout Editor     /////
/////////////////////////////////
var PopoutEditor = {
  /*  PopoutEditor allows quick editing of more complex elements.

    This is used for parts of the InsideISA email which require more input than
    simple text (eg. images, links, etc.).

    Attributes:
      $editor (HTML Element): The HTML Element containing the editor.
      $form (HTML Element): The HTML form contained within $editor.
      fields (Array of PopoutEditorField): The fields to be displayed as part
        of the PopoutEditor.
  */
  init: function() {
    // initializes the PopoutEditor by finding the editor on DOM.
    this.$editor = document.getElementById("popoutEditor");
    this.$form = this.$editor.getElementsByTagName('form')[0];
    this.fields = [];
    this.handler;
  },
  setup: function(fields, saveHandler) {
    // sets up the PopoutEditor for use.
    // fields is Array of PopoutEditorField
    // saveHandler is Function to be called when the save button is pressed.
    if (fields) {
      this.fields = fields;
    } else {
      this.fields = [];
    }
    if (saveHandler) {
      this.handler = saveHandler;
    } else {
      this.handler = undefined;
    }
  },
  display: function($where) {
    // $where (HTML element; req)
    // Takes an HTML element to use for display positioning. Displays the
    // PopoutEditor at the top right of the given element.
    this.$editor.style.top = $where.offsetTop;
    this.$editor.style.left = $where.offsetLeft + $where.offsetWidth + 25;
    this.$editor.classList.remove('hide');
  },
  hide: function() {
    this.$editor.classList.add('hide');
  }
}

var PopoutEditorField = {
  init: function(fieldName) {
    this.div = Object.create(InlineEditable);
    this.div.generateField('div', [], fieldName);
    this.div.id = fieldName
    this.label = document.createElement('label');
    this.label.setAttribute('for', fieldName);
    this.label.textContent = fieldName;
  },
  insertLabel: function($where) {
    $where.append(this.label);
  },
  insertDiv: function($where) {
    this.div.renderEditable($where);
  }
}



var PopoutEditable = {
  // PopoutEditables are elements which have multiple fields of information
  // which must be supplied. These elements use the PopoutEditor to supply all
  // the pertinent information.
  init: function(tagName, placeholder, id, style) {
    this.el = generateElement(tagName, [], id);
    this.el.setAttribute('style', style)
    if (tagName === 'img') {
      this.el.src = placeholder;
    } else {
      this.el.textContent = placeholder;
    }
  },
  fields: [],
  insertFields: function($where) {
    // iterates through fields and renders them on the given HTML element ($where)
    for (let field of fields) {
      field.insertLabel($where);
      field.insertDiv($where);
    }
  },
  addField: function(fieldName) {
    // Creates and pushes a new PopoutEditorField to this.fields.
    var field = Object.create(PopoutEditorField);
    field.init(fieldName);
    this.fields.push(field);
  },
  renderEditable: function($where, ctnKlass) {
    ctnKlasses = ['popoutEdit'];
    if (ctnKlass) {
      ctnKlasses.push(ctnKlass);
    }
    var ctn = generateElement('a', ctnKlass);
    ctn.href = '#';
    var text = generateElement('div');
    text.textContent = 'edit';
    text.classList.add(ctnKlass + '__text')
    ctn.append(text);
    ctn.append(this.el);
    if ($where && $where instanceof Element) {
      $where.append(ctn);
    } else {
      return ctn;
    }
  },
  renderFinal: function($where) {
    if ($where && $where instanceof Element) {
      $where.append(this.el);
    } else {
      return this.el;
    }
  }
}

var InlineEditable = {
  // InlineEditables are elements which can be editable in-place. They are
  // essentially elements with contenteditable set to true.
  generateField: function(tagName, klasses, id, placeholder, style) {
    // Creates an InlineEditable element with appropriate classes and attrs.
    if (!klasses) {
      klasses = [];
    }
    klasses.push('editable');
    this.el = generateElement(tagName, klasses, id);
    this.el.setAttribute('contenteditable', true);
    if (placeholder) {
      this.el.textContent = placeholder;
    }
    if (style) {
      this.el.setAttribute('style', style);
    }
  },
  render: function($where) {
    if ($where && $where instanceof Element) {
      $where.append(this.el);
    } else {
      return this.el;
    }
  },
  renderEditable: function($where) {
    this.el.classList.add('editable');
    this.el.setAttribute('contenteditable', true);
    return this.render($where);
  },
  renderFinal: function($where) {
    this.el.classList.remove('editable');
    this.el.removeAttribute('contenteditable');
    return this.render($where);
  },
  value: function() {
    return this.el.textContent;
  }
}

var blank = Object.create(PopoutEditable);
var field = Object.create(PopoutEditorField);


ContentSection = {
  id: 0, // id number, given as argument to init.
  fields: {
    // contentType: 'blah', // InlineEditable
    // contentTitle: 'Blah', // InlineEditable
    // contentImage: Object.create(PopoutEditable),
    // contentBlurb: 'paragraph', // InlineEditable
    // contentLink: Object.create(PopoutEditable)
  },

  init: function(id) {
    // generates each field in fields as a placeholder.
    /*
      Arguments:
        id (Int): the integer to be used as this section's id.
    */
    id = Number(id);
    if (isNaN(id)) {
      return False;
    }
    this.id = id;
    this.idString = 'section' + String(this.id) + '_';
    this.addInlineField('contentType', 'h2', PLACEHOLDER_TYPE, CONTENT_TYPE_STYLE);
    this.addInlineField('contentTitle', 'h1', PLACEHOLDER_TITLE, CONTENT_TITLE_STYLE);
    this.addImageField();
    this.addInlineField('contentBlurb', 'div', PLACEHOLDER_BLURB, CONTENT_BLURB_STYLE);
    this.addLinkField();
  },
  addInlineField: function(fieldName, tagName, placeholder, style) {
    this[fieldName] = Object.create(InlineEditable);
    this[fieldName].generateField(tagName, [], this.idString + fieldName, placeholder, style);
  },
  addPopoutField: function(fieldName, tagName, placeholder, popoutFields, style) {
    this[fieldName] = Object.create(PopoutEditable);
    this[fieldName].init(tagName, placeholder, this.idString + fieldName, style);
    for (let field of popoutFields) {
      this[fieldName].addField(field);
    }
  },
  addImageField: function() {
    this.addPopoutField('contentImage', 'img', PLACEHOLDER_IMG, ['URL', 'Title', 'Alt Text'], CONTENT_IMG_STYLE);
  },
  addLinkField: function() {
    this.addPopoutField('contentLink', 'span', PLACEHOLDER_LINK, ['URL', 'Text'], CONTENT_LINK_STYLE);
    // this['contentLink'].
  },
  renderEditable: function($where) {
    var ctn = document.createElement('tr');
    this.contentType.renderEditable(ctn);
    this.contentTitle.renderEditable(ctn);
    this.contentImage.renderEditable(ctn,['imgEdit']);
    this.contentBlurb.renderEditable(ctn);
    this.contentLink.renderEditable(ctn, ['linkEdit']);
    return ctn;
  },
  renderFinal: function($where) {
    var ctn = document.createElement('tr');
    var innerCtn = document.createElement('td');
    innerCtn.setAttribute('style', TD_CTN_STYLE);
    var headingCtn = document.createElement('div');
    headingCtn.setAttribute('style', CONTENT_HEADING_CTN_STYLE);
    headingCtn.append(this.contentType.renderFinal());
    headingCtn.append(this.contentTitle.renderFinal());
    ctn.append(headingCtn);
    this.contentImage.renderFinal(ctn);
    this.contentBlurb.renderFinal(ctn);
    this.contentLink.renderFinal(ctn);
    return ctn;
  }

}

EmailGenerator = {
  container: document.getElementById('emailContent'), // The div containing the content to be pasted into GRS
  sections: {
    introduction: 'paragraph', // InlineEditable
    contentSections: [ContentSection] // Array of ContentSections
  },
  init: function() {
    // find the email container in the document, generate first content section,
    // get everything good to go.
  },

  copyToClipboard: function() {
    // Copy the content of the email to the clipboard for easy pasting into GRS.
  }
}






var imgEdit = document.getElementById('imgEdit0');
var linkEdit = document.getElementById('linkEdit0');
var editor = PopoutEditor;

var ctn = document.getElementById('contentSectionsCtn');
var bottomBtns = document.getElementById('bottomBtns');
