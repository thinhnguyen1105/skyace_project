import * as React from 'react';
import { Form, Modal, Input, Select, AutoComplete } from 'antd';

const Option = Select.Option;

const MONTHS = [
  {
    id: 0,
    name: 'January'
  },
  {
    id: 1,
    name: 'February'
  },
  {
    id : 2,
    name: 'March'
  },
  {
    id : 3,
    name: 'April'
  },
  {
    id: 4,
    name: 'May'
  },
  {
    id: 5,
    name: 'June'
  },
  {
    id: 6,
    name: 'July'
  },
  {
    id: 7,
    name: 'August'
  },
  {
    id: 8,
    name: 'September'
  },
  {
    id: 9,
    name: 'October'
  },
  {
    id: 10,
    name: 'November'
  },
  {
    id: 11,
    name: 'December'
  },
]
class UpdateCourseModal extends React.Component<any, any> {
  handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }
    this.props.form.validateFields((err, _values) => {
      if (!err) {
        this.props.handleSubmit({
          data: {...this.props.updateInput, ...{isDeleted: false} }
        });
        // window.location.reload();
      }
    });
  }

  handleOk = () => {
    this.handleSubmit(null);
    window.location.reload();
  }

  handleCancel = () => {
    this.props.hideModal();
  }

  handleChange = (value) => {
    this.props.form.setFieldsValue({
      'grade': ''
    });
    this.props.handleChange({data : {
      level: value,
      grade: ''
    }});
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
        <Modal
          title={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_UPDATE_TEXT.translated}
          visible={this.props.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          okText={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_UPDATE.translated}
          cancelButtonProps={{style: {background: 'red', color: 'white', minWidth: '55px'}, type: 'danger'}}
        >
          <div>
            <Form onSubmit={this.handleSubmit}>
              <Form.Item label={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_COUNTRY.translated} style={{width: '50%', display: 'inline-block', padding: '0px 10px'}}>
                {getFieldDecorator('country', {
                  rules: [
                    {required: true, message: this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_COUNTRY_VALIDATE.translated}
                  ],
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                  initialValue: this.props.initialInput.country
                })(
                  <AutoComplete
                    dataSource={this.props.lookupInput.country ? this.props.lookupInput.country.map((item) => item.name).filter((val) => val !== 'All countries') : []}
                    placeholder={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_COUNTRY.translated}
                    filterOption={(inputValue, option: any) => option.props.children.toString().toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
                    onChange={(value) => this.props.handleChange({data : {country : value}})}
                  />
                )}
              </Form.Item>
              <Form.Item label={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_LEVEL.translated} style={{width: '50%', display: 'inline-block', padding: '0px 10px'}}>
                {getFieldDecorator('level', {
                  rules: [
                    {required: true, message: this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_LEVEL_VALIDATE.translated}
                  ],
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                  initialValue: this.props.initialInput.level._id
                })(
                  <Select style={{minWidth: '200px'}} onChange={(value) => this.handleChange(value)} placeholder={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_LEVEL.translated}>
                    {
                      this.props.levels ? this.props.levels.map((item) => item._id ? (<Option value={item._id} key={item._id}>{item.name}</Option>) : "") : ''
                    }
                  </Select>
                )}
              </Form.Item>
              <Form.Item label={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_GRADE.translated} style={{width: '50%', display: 'inline-block', padding: '0px 10px'}}>
                {getFieldDecorator('grade', {
                  rules: [
                    {required: true, message: this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_GRADE_VALIDATE_2.translated}
                  ],
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                  initialValue: this.props.initialInput.grade._id
                })(
                  <Select style={{minWidth: '200px'}} onChange={(value) => this.props.handleChange({data : {grade : value}})} placeholder='Grade'>
                    {
                      this.props.updateInput.level ?
                      this.props.grades.filter((item) => item.level._id === this.props.updateInput.level).map((item) => item._id ?
                      (<Option value={item._id} key={item._id}>{item.name}</Option>) : "") : <Option value="" key="0" disabled={true}>{this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_GRADE_VALIDATE.translated}</Option>
                    }
                  </Select>
                )}
              </Form.Item>
              <Form.Item label={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_SUBJECT.translated} style={{width: '50%', display: 'inline-block', padding: '0px 10px'}}>
                {getFieldDecorator('subject', {
                  rules: [
                    {required: true, message: this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_SUBJECT_VALIDATE.translated}
                  ],
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                  initialValue: this.props.initialInput.subject._id,
                })(
                  <Select style={{minWidth: '200px'}} onChange={(value) => this.props.handleChange({data: {subject: value}})} placeholder='Subject'>
                    {
                      this.props.subjects ? this.props.subjects.map((item) => item._id ? (<Option value={item._id} key={item._id}>{item.name}</Option>) : "") : ''
                    }
                  </Select>
                  // <Input type="text" placeholder="Subject" onChange={(e) => this.props.handleChange({data: {subject: e.target.value}})} />
                )}
              </Form.Item>
              <Form.Item label={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_NO_OF_LESSON.translated} style={{width: '50%', display: 'inline-block', padding: '0px 10px'}}>
                {getFieldDecorator('session', {
                  rules: [
                    {required: true, message: this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_NO_OF_LESSON_VALIDATE.translated}
                  ],
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                  initialValue: this.props.initialInput.session,
                })(
                  <Input
                    type='number'
                    placeholder={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_NO_OF_LESSON.translated}
                    onChange={(e) => this.props.handleChange({data : {session : e.target.value}})}
                  />
                )}
              </Form.Item>
              <Form.Item label={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_HOURS_PER_LESSON.translated} style={{width: '50%', display: 'inline-block', padding: '0px 10px'}}>
                {getFieldDecorator('hourPerSession', {
                  rules: [
                    {required: true, message: this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_HOURS_PER_LESSON_VALIDATE.translated}
                  ],
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                  initialValue: this.props.initialInput.hourPerSession
                })(
                  <Select style={{minWidth: '200px'}} onChange={(value) => this.props.handleChange({data : {hourPerSession : value}})} placeholder='Hours Per Lesson'>
                    {
                      this.props.lookupInput.hourPerSession ? this.props.lookupInput.hourPerSession.map((item) => item._id ? (<Option value={item.content} key={item._id}>{item.content}</Option>) : "") : ''
                    }
                  </Select>
                )}
              </Form.Item>
              <Form.Item label={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_START_YEAR.translated} style={{width: '50%', display: 'inline-block', padding: '0px 10px'}}>
                {getFieldDecorator('academicStart', {
                  rules: [
                    {required: true, message: this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_START_YEAR_VALIDATE.translated}
                  ],
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                  initialValue: this.props.initialInput.academicStart
                })(
                  <Select style={{minWidth: '200px'}} onChange={(val) => this.props.handleChange({data: {academicStart: val}})} placeholder='Start of academic year'>
                  {
                    MONTHS.map((item) => (
                      <Option value={item.name} key={item.id.toString()}>{item.name}</Option>
                    ))
                  }
                  </Select>
                )}
              </Form.Item>
              <Form.Item label={this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_END_YEAR.translated} style={{width: '50%', display: 'inline-block', padding: '0px 10px'}}>
                {getFieldDecorator('academicEnd', {
                  rules: [
                    {required: true, message: this.props.languageState.ACADEMIC_SETUP_CREATE_NEW_COURSE_END_YEAR_VALIDATE.translated}
                  ],
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                  initialValue: this.props.initialInput.academicEnd
                })(
                  <Select style={{minWidth: '200px'}} onChange={(val) => this.props.handleChange({data: {academicEnd: val}})} placeholder='End of academic year'>
                  {
                    MONTHS.map((item) => (
                      <Option value={item.name} key={item.id.toString()}>{item.name}</Option>
                    ))
                  }
                  </Select>
                )}
              </Form.Item>
            </Form>
          </div>
        </Modal>
    );
  }
}

export default Form.create()(UpdateCourseModal);
