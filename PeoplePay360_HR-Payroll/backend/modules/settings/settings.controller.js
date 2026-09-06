const settingsRepository = require('./settings.repository');

const getDepartments = async (req, res, next) => {
  try {
    const departments = await settingsRepository.getDepartments();
    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const department = await settingsRepository.findDepartmentById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, color, icon, headOfDepartment, positions } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    const created = await settingsRepository.createDepartment({
      name,
      code,
      description,
      color,
      icon,
      headOfDepartment,
      positions
    });

    res.status(201).json({
      success: true,
      message: `Department '${name}' created successfully`,
      data: created
    });
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const updated = await settingsRepository.updateDepartment(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Department not found to update'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const deleted = await settingsRepository.deleteDepartment(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Department not found to delete'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
      data: deleted
    });
  } catch (error) {
    next(error);
  }
};

const addPosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, code, description, level, defaultSalary } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Position title is required'
      });
    }

    const updated = await settingsRepository.addPosition(id, {
      title,
      code,
      description,
      level,
      defaultSalary
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(201).json({
      success: true,
      message: `Position '${title}' added successfully`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const updatePosition = async (req, res, next) => {
  try {
    const { id, posId } = req.params;
    const updated = await settingsRepository.updatePosition(id, posId, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Department or Position not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Position updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const deletePosition = async (req, res, next) => {
  try {
    const { id, posId } = req.params;
    const updated = await settingsRepository.deletePosition(id, posId);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Department or Position not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Position deleted successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addPosition,
  updatePosition,
  deletePosition
};
